// Saisons hebdomadaires : à chaque changement de semaine ISO (lundi 00:00 UTC),
// le plus gros gagnant de la semaine écoulée entre au `hall_of_fame` et se fait
// couronner publiquement. Cadencé par le tick du sweep. Auto-importé (`useSeasons`).
import type { HallOfFameEntry } from "../types.js";

const STATE_KEY = "season_last";

/** Lundi 00:00 UTC de la semaine ISO contenant `date`. */
export function isoWeekStart(date: Date): Date {
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const weekday = (day.getUTCDay() + 6) % 7; // lundi = 0
  day.setUTCDate(day.getUTCDate() - weekday);
  return day;
}

/** Clé de semaine ISO, ex. "2026-W27". */
export function isoWeekKey(date: Date): string {
  // Norme ISO-8601 : la semaine appartient à l'année de son jeudi.
  const thursday = new Date(isoWeekStart(date));
  thursday.setUTCDate(thursday.getUTCDate() + 3);
  const yearStart = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

async function crownLastWeek(): Promise<void> {
  const now = new Date();
  const currentStart = isoWeekStart(now);
  const previousStart = new Date(currentStart.getTime() - 7 * 86_400_000);
  const season = isoWeekKey(previousStart);

  const [winner] = await useEconomy().earnedTop(previousStart, currentStart, 1);
  if (!winner || winner.balance <= 0) {
    logger.info("Seasons", `Semaine ${season} : aucun gagnant à couronner.`);
    return;
  }

  const inserted = await useDb().query(
    `INSERT INTO hall_of_fame (season, user_id, earned) VALUES ($1, $2, $3)
     ON CONFLICT (season) DO NOTHING`,
    [season, winner.discordId, winner.balance],
  );
  if (inserted.rowCount === 0) return; // déjà couronné (autre instance)

  const channelId = useConfig().eventsChannelId;
  if (channelId) {
    const channel = await useClient().channels.fetch(channelId);
    if (channel && channel.isSendable()) {
      await channel.send(
        pickPhrase("season_crown", {
          target: `<@${winner.discordId}>`,
          amount: winner.balance,
        }),
      );
    }
  }
  logger.info("Seasons", `Semaine ${season} : ${winner.discordId} couronné (${winner.balance}).`);
}

export interface Seasons {
  /** Appelé par le sweep : détecte le changement de semaine et couronne. */
  tick(): Promise<void>;
  /** Le panthéon, du plus récent au plus ancien. */
  hallOfFame(limit?: number): Promise<HallOfFameEntry[]>;
}

export const useSeasons = (): Seasons => ({
  async tick() {
    const current = isoWeekKey(new Date());
    const last = await useAppState().get<string>(STATE_KEY);

    if (last === current) return;
    // Première exécution : on arme simplement la détection, pas de couronnement
    // rétroactif sur des données partielles.
    if (last !== null) {
      await crownLastWeek();
    }
    await useAppState().set(STATE_KEY, current);
  },

  async hallOfFame(limit = 10) {
    const { rows } = await useDb().query<{
      season: string;
      user_id: string;
      earned: number;
      crowned_at: Date;
    }>(
      "SELECT season, user_id, earned, crowned_at FROM hall_of_fame ORDER BY crowned_at DESC LIMIT $1",
      [limit],
    );
    return rows.map((r) => ({
      season: r.season,
      userId: r.user_id,
      earned: r.earned,
      crownedAt: r.crowned_at,
    }));
  },
});
