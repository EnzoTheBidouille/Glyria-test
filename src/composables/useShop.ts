// Boutique : catalogue + orchestration d'achat + cycle de vie des perks.
// L'achat débite en base PUIS applique l'effet Discord ; si l'effet échoue, on
// rembourse et on supprime le perk (compensation). Auto-importé (`useShop`).
import type {
  ActivePerk,
  PerkRevert,
  PerkType,
  PurchaseInput,
  ShopItem,
  ShopItemConfig,
} from "../types.js";

interface ShopItemRow {
  id: string;
  name: string;
  cost: number;
  type: string;
  config: ShopItemConfig;
  active: boolean;
}

interface ActivePerkRow {
  id: number;
  user_id: string;
  item_id: string;
  type: string;
  granted_at: Date;
  expires_at: Date | null;
  revert: PerkRevert;
}

const mapItem = (row: ShopItemRow): ShopItem => ({
  id: row.id,
  name: row.name,
  cost: row.cost,
  type: row.type as PerkType,
  config: row.config,
  active: row.active,
});

const mapPerk = (row: ActivePerkRow): ActivePerk => ({
  id: row.id,
  userId: row.user_id,
  itemId: row.item_id,
  type: row.type as PerkType,
  grantedAt: row.granted_at,
  expiresAt: row.expires_at,
  revert: row.revert,
});

async function readChannelName(channelId: string): Promise<string> {
  const channel = await useClient().channels.fetch(channelId);
  return channel && "name" in channel && typeof channel.name === "string"
    ? channel.name
    : "salon";
}

export interface PurchaseResult {
  item: ShopItem;
  cost: number;
  expiresAt: Date | null;
}

export interface Shop {
  list(): Promise<ShopItem[]>;
  get(id: string): Promise<ShopItem | null>;
  purchase(input: PurchaseInput): Promise<PurchaseResult>;
  dueActivePerks(): Promise<ActivePerk[]>;
  getActivePerk(id: number): Promise<ActivePerk | null>;
  /** Révocation admin : annule l'effet et supprime le perk (sans remboursement). */
  revokePerk(id: number): Promise<boolean>;
  /** Supprime la ligne perk (après annulation par le sweep). */
  deletePerk(id: number): Promise<void>;
}

const PERK_SELECT = `
  SELECT ap.id, ap.user_id, ap.item_id, ap.granted_at, ap.expires_at, ap.revert, si.type
    FROM active_perks ap
    JOIN shop_items si ON si.id = ap.item_id`;

export const useShop = (): Shop => {
  const db = useDb();

  const get: Shop["get"] = async (id) => {
    const { rows } = await db.query<ShopItemRow>(
      "SELECT id, name, cost, type, config, active FROM shop_items WHERE id = $1",
      [id],
    );
    return rows[0] ? mapItem(rows[0]) : null;
  };

  const getActivePerk: Shop["getActivePerk"] = async (id) => {
    const { rows } = await db.query<ActivePerkRow>(
      `${PERK_SELECT} WHERE ap.id = $1`,
      [id],
    );
    return rows[0] ? mapPerk(rows[0]) : null;
  };

  const deletePerk: Shop["deletePerk"] = async (id) => {
    await db.query("DELETE FROM active_perks WHERE id = $1", [id]);
  };

  return {
    get,
    getActivePerk,
    deletePerk,

    async list() {
      const { rows } = await db.query<ShopItemRow>(
        "SELECT id, name, cost, type, config, active FROM shop_items WHERE active = TRUE ORDER BY cost ASC",
      );
      return rows.map(mapItem);
    },

    async dueActivePerks() {
      const { rows } = await db.query<ActivePerkRow>(
        `${PERK_SELECT} WHERE ap.expires_at IS NOT NULL AND ap.expires_at <= now()`,
      );
      return rows.map(mapPerk);
    },

    async revokePerk(id) {
      const perk = await getActivePerk(id);
      if (!perk) return false;
      await usePerks().revert(perk);
      await deletePerk(id);
      return true;
    },

    async purchase({ userId, itemId, value, channelId }) {
      const item = await get(itemId);
      if (!item || !item.active) {
        throw new CaillouError(pickPhrase("buy_unavailable"));
      }
      const cfg = item.config;

      // ── Validation des prérequis (avant tout débit) ──────────────────────
      const cleanValue = value?.trim() || undefined;
      if (cfg.needsValue && !cleanValue) {
        throw new CaillouError(pickPhrase("buy_needs_value", { name: "toi" }));
      }
      if (cleanValue) {
        // Limites Discord : nom de salon 100, statut custom 128. Vérifié avant
        // le débit pour éviter un aller-retour débit → échec API → remboursement.
        const maxLen = item.type === "channel_rename" ? 100 : 128;
        if (cleanValue.length > maxLen) {
          throw new CaillouError(pickPhrase("buy_too_long", { max: maxLen }));
        }
      }
      if (cfg.needsChannel) {
        if (!channelId) {
          throw new CaillouError(pickPhrase("buy_needs_channel"));
        }
        if (!useConfig().renameWhitelist.includes(channelId)) {
          throw new CaillouError(pickPhrase("buy_bad_channel"));
        }
      }

      // ── Rôle déjà détenu : on prolonge le perk existant au lieu d'en
      //    empiler un second (sinon l'expiration du premier retirerait le rôle
      //    encore payé par le second). Ne concerne pas les rôles singleHolder,
      //    dont le rachat passe par la logique de détrônage.
      if (cfg.roleEnvKey && !cfg.singleHolder && cfg.durationMs) {
        const { rows } = await db.query<{ id: number; expires_at: Date | null }>(
          `SELECT id, expires_at FROM active_perks
            WHERE user_id = $1 AND item_id = $2
              AND (expires_at IS NULL OR expires_at > now())
            ORDER BY expires_at DESC NULLS FIRST
            LIMIT 1`,
          [userId, item.id],
        );
        const existing = rows[0];
        if (existing) {
          const base = Math.max(existing.expires_at?.getTime() ?? 0, Date.now());
          const newExpiry = new Date(base + cfg.durationMs);
          await db.withTransaction(async (client) => {
            await useEconomy().debit(client, userId, item.cost, `buy:${item.id}:extend`);
            await client.query(
              "UPDATE active_perks SET expires_at = $2 WHERE id = $1",
              [existing.id, newExpiry],
            );
          });
          return { item, cost: item.cost, expiresAt: newExpiry };
        }
      }

      // ── Données d'annulation lues AVANT le débit (lecture Discord) ────────
      const revert: PerkRevert = {};
      if (cfg.roleEnvKey) {
        const roleId = process.env[cfg.roleEnvKey]?.trim();
        if (!roleId) throw new CaillouError(pickPhrase("buy_misconfigured"));
        revert.roleId = roleId;
      }
      if (item.type === "channel_rename" && channelId) {
        revert.channelId = channelId;
        revert.appliedValue = cleanValue;
        // Si un renommage est déjà actif sur ce salon, le nom courant est déjà
        // un nom de perk : on hérite du VRAI nom d'origine pour que la dernière
        // expiration restaure le nom initial, pas un nom acheté intermédiaire.
        const { rows } = await db.query<{ revert: PerkRevert }>(
          `SELECT ap.revert
             FROM active_perks ap
             JOIN shop_items si ON si.id = ap.item_id
            WHERE si.type = 'channel_rename'
              AND ap.revert->>'channelId' = $1
              AND (ap.expires_at IS NULL OR ap.expires_at > now())
            ORDER BY ap.granted_at DESC
            LIMIT 1`,
          [channelId],
        );
        revert.originalName =
          rows[0]?.revert.originalName ?? (await readChannelName(channelId));
      }
      if (item.type === "bot_status") {
        revert.appliedValue = cleanValue;
      }

      const expiresAt = cfg.durationMs ? new Date(Date.now() + cfg.durationMs) : null;

      // ── Débit + insertion du perk dans UNE transaction ───────────────────
      const perkId = await db.withTransaction(async (client) => {
        await useEconomy().debit(client, userId, item.cost, `buy:${item.id}`);
        const { rows } = await client.query<{ id: number }>(
          `INSERT INTO active_perks (user_id, item_id, expires_at, revert)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [userId, item.id, expiresAt, JSON.stringify(revert)],
        );
        return rows[0]?.id;
      });

      if (perkId == null) {
        throw new CaillouError(pickPhrase("error_generic"));
      }

      // ── Effet Discord ; compensation (remboursement) si échec ────────────
      try {
        await usePerks().grant(item, userId, { value: cleanValue, revert, perkId });
      } catch (err) {
        logger.error(
          "Shop",
          `Effet du perk ${item.id} échoué, remboursement de ${item.cost} : ${(err as Error).message}`,
        );
        await db.withTransaction(async (client) => {
          await client.query("DELETE FROM active_perks WHERE id = $1", [perkId]);
          await useEconomy().credit(client, userId, item.cost, `refund:${item.id}`);
        });
        throw err instanceof CaillouError ? err : new CaillouError(pickPhrase("error_generic"));
      }

      return { item, cost: item.cost, expiresAt };
    },
  };
};
