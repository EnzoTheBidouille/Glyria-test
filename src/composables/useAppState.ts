// Petit état applicatif clé/valeur persisté en base (table `app_state`).
// Pour tout ce qui doit survivre à un redémarrage sans mériter sa propre table
// (météorites en cours, dernière saison couronnée…). Auto-importé (`useAppState`).

export interface AppState {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<void>;
}

export const useAppState = (): AppState => {
  const db = useDb();
  return {
    async get<T>(key: string): Promise<T | null> {
      const { rows } = await db.query<{ value: T }>(
        "SELECT value FROM app_state WHERE key = $1",
        [key],
      );
      return rows[0]?.value ?? null;
    },

    async set(key, value) {
      await db.query(
        `INSERT INTO app_state (key, value, updated_at) VALUES ($1, $2, now())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
        [key, JSON.stringify(value)],
      );
    },
  };
};
