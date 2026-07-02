// Application et annulation des perks côté Discord (rôles, renommage de salon,
// statut du bot). Aucun perk n'accorde de pouvoir destructeur ; tout est
// réversible. Auto-importé (`usePerks`).
import type { GuildMember } from "discord.js";
import type { ActivePerk, PerkRevert, ShopItem } from "../types.js";

async function getMember(userId: string): Promise<GuildMember> {
  const guild = await useClient().guilds.fetch(useConfig().guildId);
  return guild.members.fetch(userId);
}

async function renameChannel(channelId: string, name: string): Promise<void> {
  const channel = await useClient().channels.fetch(channelId);
  if (channel && "setName" in channel && typeof channel.setName === "function") {
    // Pas d'appel API si le nom est déjà le bon : Discord limite les renommages
    // de salon à 2 par 10 minutes, chaque appel économisé compte.
    if ("name" in channel && channel.name === name) return;
    await channel.setName(name, "Perk du Caillou Magique");
  }
}

/**
 * Le perk encore actif le plus récent d'un type donné, hors `excludeId`.
 * Sert à réappliquer le "suivant" quand un perk qui se superpose expire
 * (deux statuts achetés à la suite, deux renommages du même salon…).
 */
async function latestActivePerk(
  type: ActivePerk["type"],
  excludeId: number | null,
  channelId?: string,
): Promise<PerkRevert | null> {
  const { rows } = await useDb().query<{ revert: PerkRevert }>(
    `SELECT ap.revert
       FROM active_perks ap
       JOIN shop_items si ON si.id = ap.item_id
      WHERE si.type = $1
        AND ($2::bigint IS NULL OR ap.id <> $2)
        AND ($3::text IS NULL OR ap.revert->>'channelId' = $3)
        AND (ap.expires_at IS NULL OR ap.expires_at > now())
      ORDER BY ap.granted_at DESC
      LIMIT 1`,
    [type, excludeId, channelId ?? null],
  );
  return rows[0]?.revert ?? null;
}

function applyStatus(text: string): void {
  useClient().user?.setActivity({
    name: text,
    type: djs.ActivityType.Custom,
    state: text,
  });
}

export interface GrantOptions {
  value?: string;
  revert: PerkRevert;
  perkId: number;
}

export interface Perks {
  /** Applique l'effet Discord du perk (appelé après le débit en base). */
  grant(item: ShopItem, userId: string, opts: GrantOptions): Promise<void>;
  /** Défait un perk (expiration ou révocation admin). Best-effort, ne jette pas. */
  revert(perk: ActivePerk): Promise<void>;
  /**
   * Applique le statut payé encore actif le plus récent, sinon le statut par
   * défaut. Appelé au ClientReady pour qu'un statut acheté survive au restart.
   */
  restoreStatus(): Promise<void>;
}

export const usePerks = (): Perks => {
  return {
    async restoreStatus() {
      const active = await latestActivePerk("bot_status", null);
      applyStatus(active?.appliedValue ?? useConfig().defaultStatus);
    },

    async grant(item, userId, opts) {
      switch (item.type) {
        case "color_role": {
          if (!opts.revert.roleId) throw new CaillouError(pickPhrase("buy_misconfigured"));
          const member = await getMember(userId);
          await member.roles.add(opts.revert.roleId, "Perk : rôle de couleur");
          break;
        }

        case "prestige_role": {
          const roleId = opts.revert.roleId;
          if (!roleId) throw new CaillouError(pickPhrase("buy_misconfigured"));

          // Détrôner le(s) détenteur(s) précédent(s) : un seul Élu à la fois.
          const previous = await useDb().query<{ id: number; user_id: string }>(
            `SELECT ap.id, ap.user_id
               FROM active_perks ap
               JOIN shop_items si ON si.id = ap.item_id
              WHERE si.type = 'prestige_role' AND ap.id <> $1`,
            [opts.perkId],
          );
          for (const row of previous.rows) {
            try {
              const old = await getMember(row.user_id);
              await old.roles.remove(roleId, "Détrôné : nouvel Élu du Caillou");
            } catch (err) {
              logger.warn("Perks", `Retrait du rôle prestige échoué (${row.user_id}) : ${(err as Error).message}`);
            }
            await useDb().query("DELETE FROM active_perks WHERE id = $1", [row.id]);
          }

          const member = await getMember(userId);
          await member.roles.add(roleId, "Perk : L'Élu du Caillou");
          break;
        }

        case "channel_rename": {
          if (!opts.revert.channelId || !opts.value) {
            throw new CaillouError(pickPhrase("buy_misconfigured"));
          }
          await renameChannel(opts.revert.channelId, opts.value);
          break;
        }

        case "bot_status": {
          if (!opts.value) throw new CaillouError(pickPhrase("buy_misconfigured"));
          applyStatus(opts.value);
          break;
        }
      }
    },

    async revert(perk) {
      try {
        switch (perk.type) {
          case "color_role":
          case "prestige_role": {
            if (perk.revert.roleId) {
              const member = await getMember(perk.userId);
              await member.roles.remove(perk.revert.roleId, "Expiration du perk");
            }
            break;
          }
          case "channel_rename": {
            if (perk.revert.channelId) {
              // Si un autre renommage payé est encore actif sur ce salon, c'est
              // son nom qui doit rester, pas le nom d'origine.
              const next = await latestActivePerk(
                "channel_rename",
                perk.id,
                perk.revert.channelId,
              );
              const name = next?.appliedValue ?? perk.revert.originalName;
              if (name) await renameChannel(perk.revert.channelId, name);
            }
            break;
          }
          case "bot_status": {
            // Même logique : ne pas écraser un statut payé plus récent.
            const next = await latestActivePerk("bot_status", perk.id);
            applyStatus(next?.appliedValue ?? useConfig().defaultStatus);
            break;
          }
        }
      } catch (err) {
        logger.warn("Perks", `Annulation du perk #${perk.id} échouée : ${(err as Error).message}`);
      }
    },
  };
};
