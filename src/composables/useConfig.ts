// Configuration typée, validée et mémoïsée, lue depuis l'environnement.
// glyria charge .env automatiquement au démarrage. Auto-importé (`useConfig`).

export interface AppConfig {
  databaseUrl: string;
  guildId: string;
  colorRoleId: string | undefined;
  prestigeRoleId: string | undefined;
  renameWhitelist: readonly string[];
  defaultStatus: string;
  earn: {
    min: number;
    max: number;
    cooldownMs: number;
  };
  /** Salon des annonces d'événements (météorites, taxe, couronnement). Vide = événements désactivés. */
  eventsChannelId: string | undefined;
  bet: {
    /** Mise maximale par pari. */
    maxStake: number;
    /** Pertes nettes maximales par jour UTC (parier + duel confondus). */
    dailyLossCap: number;
  };
  claim: {
    /** Montant de base de l'offrande quotidienne. */
    base: number;
    /** Bonus par jour de série supplémentaire. */
    streakBonus: number;
    /** Plafond du bonus de série (en jours comptés). */
    streakCapDays: number;
  };
  interjection: {
    /** Probabilité (0..1) qu'un message déclenche une pique spontanée. */
    chance: number;
    /** Silence minimal entre deux piques dans un même salon (ms). */
    cooldownMs: number;
  };
}

let cached: AppConfig | undefined;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Variable d'environnement manquante : ${name}`);
  }
  return value.trim();
}

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || raw.trim() === "") return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Variable d'environnement invalide : ${name} doit être un entier.`);
  }
  return parsed;
}

export const useConfig = (): AppConfig => {
  if (cached) return cached;

  const min = intEnv("EARN_MIN", 1);
  const max = intEnv("EARN_MAX", 3);
  const cooldownSeconds = intEnv("EARN_COOLDOWN_SECONDS", 60);

  if (min < 0 || max < 0 || min > max) {
    throw new Error(
      `Réglages d'économie invalides : EARN_MIN (${min}) doit être >= 0 et <= EARN_MAX (${max}).`,
    );
  }
  if (cooldownSeconds < 0) {
    throw new Error("EARN_COOLDOWN_SECONDS doit être >= 0.");
  }

  const renameWhitelist = (process.env.RENAME_WHITELIST ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  const maxStake = intEnv("BET_MAX_STAKE", 250);
  const dailyLossCap = intEnv("BET_DAILY_LOSS_CAP", 500);
  if (maxStake <= 0 || dailyLossCap <= 0) {
    throw new Error("BET_MAX_STAKE et BET_DAILY_LOSS_CAP doivent être > 0.");
  }

  const interjectionPct = intEnv("INTERJECTION_PERCENT", 1); // % de chance par message ; 0 = désactivé
  if (interjectionPct < 0 || interjectionPct > 100) {
    throw new Error("INTERJECTION_PERCENT doit être entre 0 et 100.");
  }

  cached = Object.freeze({
    databaseUrl: requireEnv("DATABASE_URL"),
    guildId: requireEnv("GUILD_ID"),
    colorRoleId: process.env.COLOR_ROLE_ID?.trim() || undefined,
    prestigeRoleId: process.env.PRESTIGE_ROLE_ID?.trim() || undefined,
    renameWhitelist: Object.freeze(renameWhitelist),
    defaultStatus: process.env.DEFAULT_STATUS?.trim() || "rumine dans le vide cosmique",
    earn: Object.freeze({ min, max, cooldownMs: cooldownSeconds * 1000 }),
    eventsChannelId: process.env.EVENTS_CHANNEL_ID?.trim() || undefined,
    bet: Object.freeze({ maxStake, dailyLossCap }),
    claim: Object.freeze({
      base: intEnv("CLAIM_BASE", 25),
      streakBonus: intEnv("CLAIM_STREAK_BONUS", 5),
      streakCapDays: intEnv("CLAIM_STREAK_CAP_DAYS", 7),
    }),
    interjection: Object.freeze({
      chance: interjectionPct / 100,
      cooldownMs: intEnv("INTERJECTION_COOLDOWN_SECONDS", 600) * 1000,
    }),
  });

  return cached;
};
