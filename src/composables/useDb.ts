// Couche d'accès PostgreSQL : pool partagé + helper de transaction.
// Auto-importé globalement par glyria (`useDb`).
import pg from "pg";
import type { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";

const { Pool: PgPool } = pg;

// Par défaut, pg renvoie les BIGINT (OID 20) en `string`. Les montants de
// poussière restent largement sous Number.MAX_SAFE_INTEGER : on les parse en
// nombre pour manipuler des `number` partout dans l'app.
pg.types.setTypeParser(20, (value: string) => Number.parseInt(value, 10));

let pool: Pool | undefined;

function ensurePool(): Pool {
  if (!pool) {
    pool = new PgPool({ connectionString: useConfig().databaseUrl });
    pool.on("error", (err) => {
      logger.error("Database", `Erreur du pool : ${err.message}`);
    });
  }
  return pool;
}

export interface Db {
  /** Requête simple via le pool. */
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: readonly unknown[],
  ): Promise<QueryResult<T>>;
  /**
   * Exécute `fn` dans une transaction (BEGIN/COMMIT, ROLLBACK en cas d'erreur).
   * C'est le SEUL point d'entrée autorisé pour modifier une balance.
   */
  withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T>;
  /** Ferme le pool (arrêt propre). */
  close(): Promise<void>;
}

export const useDb = (): Db => {
  return {
    query(text, params) {
      return ensurePool().query(text, params as unknown[]);
    },

    async withTransaction(fn) {
      const client = await ensurePool().connect();
      try {
        await client.query("BEGIN");
        const result = await fn(client);
        await client.query("COMMIT");
        return result;
      } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        throw err;
      } finally {
        client.release();
      }
    },

    async close() {
      if (pool) {
        await pool.end();
        pool = undefined;
      }
    },
  };
};
