// Lanceur de migrations indépendant du framework : n'utilise QUE node + pg
// (aucun global glyria), afin de tourner aussi bien dans l'app (au boot) qu'en
// CLI autonome (`npm run migrate`).
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

const { Client } = pg;

export interface MigrationResult {
  applied: string[];
  alreadyUpToDate: boolean;
}

/**
 * Applique, dans l'ordre alphabétique, toutes les migrations `.sql` non encore
 * jouées. Chaque migration tourne dans sa propre transaction. Idempotent : les
 * migrations déjà enregistrées dans `_migrations` sont ignorées.
 */
export async function runMigrations(
  databaseUrl: string,
  migrationsDir: string = resolve(process.cwd(), "db", "migrations"),
): Promise<MigrationResult> {
  if (!databaseUrl) {
    throw new Error("runMigrations: DATABASE_URL manquant.");
  }

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  const applied: string[] = [];
  try {
    // Verrou consultatif : si deux instances démarrent en même temps (rolling
    // deploy), une seule joue les migrations, l'autre attend puis ne voit plus
    // rien à faire. Libéré automatiquement à la fermeture de la connexion.
    await client.query("SELECT pg_advisory_lock(hashtext('caillou_migrations'))");

    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name       TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `);

    const { rows } = await client.query<{ name: string }>(
      "SELECT name FROM _migrations",
    );
    const done = new Set(rows.map((r) => r.name));

    for (const file of files) {
      if (done.has(file)) continue;

      const sql = readFileSync(resolve(migrationsDir, file), "utf8");
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
        await client.query("COMMIT");
        applied.push(file);
      } catch (err) {
        await client.query("ROLLBACK");
        throw new Error(
          `Échec de la migration ${file}: ${(err as Error).message}`,
          { cause: err },
        );
      }
    }
  } finally {
    await client.end();
  }

  return { applied, alreadyUpToDate: applied.length === 0 };
}
