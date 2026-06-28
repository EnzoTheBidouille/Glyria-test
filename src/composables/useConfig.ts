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

  cached = Object.freeze({
    databaseUrl: requireEnv("DATABASE_URL"),
    guildId: requireEnv("GUILD_ID"),
    colorRoleId: process.env.COLOR_ROLE_ID?.trim() || undefined,
    prestigeRoleId: process.env.PRESTIGE_ROLE_ID?.trim() || undefined,
    renameWhitelist: Object.freeze(renameWhitelist),
    defaultStatus: process.env.DEFAULT_STATUS?.trim() || "rumine dans le vide cosmique",
    earn: Object.freeze({ min, max, cooldownMs: cooldownSeconds * 1000 }),
  });

  return cached;
};
