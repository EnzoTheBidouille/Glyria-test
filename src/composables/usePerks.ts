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
    await channel.setName(name, "Perk du Caillou Magique");
  }
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
  /** Restaure le statut par défaut du bot. */
  resetStatus(): void;
}

export const usePerks = (): Perks => {
  return {
    resetStatus() {
      applyStatus(useConfig().defaultStatus);
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
            if (perk.revert.channelId && perk.revert.originalName) {
              await renameChannel(perk.revert.channelId, perk.revert.originalName);
            }
            break;
          }
          case "bot_status": {
            applyStatus(useConfig().defaultStatus);
            break;
          }
        }
      } catch (err) {
        logger.warn("Perks", `Annulation du perk #${perk.id} échouée : ${(err as Error).message}`);
      }
    },
  };
};
