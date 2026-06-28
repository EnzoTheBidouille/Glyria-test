// Cœur de l'économie. INVARIANT : toute variation de balance passe par une
// transaction DB et écrit une ligne dans `transactions`. Verrouillage par ligne
// (SELECT … FOR UPDATE) pour éviter les races sur le solde.
// Auto-importé globalement (`useEconomy`).
import type { PoolClient } from "pg";
import type { LeaderboardEntry } from "../types.js";

/** Crée la ligne user si besoin, la verrouille, renvoie le solde courant. */
async function ensureAndLock(client: PoolClient, userId: string): Promise<number> {
  await client.query(
    "INSERT INTO users (discord_id) VALUES ($1) ON CONFLICT (discord_id) DO NOTHING",
    [userId],
  );
  const { rows } = await client.query<{ balance: number }>(
    "SELECT balance FROM users WHERE discord_id = $1 FOR UPDATE",
    [userId],
  );
  return rows[0]?.balance ?? 0;
}

async function writeTransaction(
  client: PoolClient,
  userId: string,
  delta: number,
  reason: string,
): Promise<void> {
  await client.query(
    "INSERT INTO transactions (user_id, delta, reason) VALUES ($1, $2, $3)",
    [userId, delta, reason],
  );
}

export interface Economy {
  balanceOf(userId: string): Promise<number>;
  earn(userId: string): Promise<{ awarded: number; balance: number }>;
  give(fromId: string, toId: string, amount: number): Promise<{ balance: number }>;
  leaderboard(limit?: number): Promise<LeaderboardEntry[]>;
  adjust(userId: string, delta: number, reason: string): Promise<{ balance: number }>;
  /** Débit bas niveau, à appeler DANS une transaction existante (ex. achat). */
  debit(client: PoolClient, userId: string, amount: number, reason: string): Promise<number>;
  /** Crédit bas niveau, à appeler DANS une transaction existante (ex. remboursement). */
  credit(client: PoolClient, userId: string, amount: number, reason: string): Promise<number>;
}

export const useEconomy = (): Economy => {
  const db = useDb();

  const debit: Economy["debit"] = async (client, userId, amount, reason) => {
    const balance = await ensureAndLock(client, userId);
    if (balance < amount) {
      throw new CaillouError(
        pickPhrase("buy_broke", { cost: amount }),
      );
    }
    const { rows } = await client.query<{ balance: number }>(
      "UPDATE users SET balance = balance - $2 WHERE discord_id = $1 RETURNING balance",
      [userId, amount],
    );
    await writeTransaction(client, userId, -amount, reason);
    return rows[0]?.balance ?? balance - amount;
  };

  const credit: Economy["credit"] = async (client, userId, amount, reason) => {
    await ensureAndLock(client, userId);
    const { rows } = await client.query<{ balance: number }>(
      "UPDATE users SET balance = balance + $2 WHERE discord_id = $1 RETURNING balance",
      [userId, amount],
    );
    await writeTransaction(client, userId, amount, reason);
    return rows[0]?.balance ?? 0;
  };

  return {
    debit,
    credit,

    async balanceOf(userId) {
      const { rows } = await db.query<{ balance: number }>(
        "SELECT balance FROM users WHERE discord_id = $1",
        [userId],
      );
      return rows[0]?.balance ?? 0;
    },

    async earn(userId) {
      const { earn } = useConfig();
      const award =
        Math.floor(Math.random() * (earn.max - earn.min + 1)) + earn.min;

      return db.withTransaction(async (client) => {
        await client.query(
          "INSERT INTO users (discord_id) VALUES ($1) ON CONFLICT (discord_id) DO NOTHING",
          [userId],
        );
        // UPDATE atomique respectant le cooldown : ne crédite que si la fenêtre
        // est écoulée. rowCount = 0 => en cooldown, rien n'est minté.
        const { rows } = await client.query<{ balance: number }>(
          `UPDATE users
              SET balance = balance + $2, last_earn_at = now()
            WHERE discord_id = $1
              AND (last_earn_at IS NULL OR last_earn_at <= now() - make_interval(secs => $3))
          RETURNING balance`,
          [userId, award, earn.cooldownMs / 1000],
        );

        const updated = rows[0];
        if (!updated) {
          const current = await client.query<{ balance: number }>(
            "SELECT balance FROM users WHERE discord_id = $1",
            [userId],
          );
          return { awarded: 0, balance: current.rows[0]?.balance ?? 0 };
        }

        await writeTransaction(client, userId, award, "earn");
        return { awarded: award, balance: updated.balance };
      });
    },

    async give(fromId, toId, amount) {
      if (!Number.isInteger(amount) || amount <= 0) {
        throw new CaillouError(pickPhrase("give_bad_amount", { amount }));
      }
      if (fromId === toId) {
        throw new CaillouError(pickPhrase("give_self"));
      }

      return db.withTransaction(async (client) => {
        // Verrou dans un ordre déterministe (par discord_id) pour éviter les
        // interblocages entre deux /give croisés.
        for (const id of [fromId, toId].sort()) {
          await ensureAndLock(client, id);
        }

        const { rows } = await client.query<{ balance: number }>(
          "SELECT balance FROM users WHERE discord_id = $1",
          [fromId],
        );
        const fromBalance = rows[0]?.balance ?? 0;
        if (fromBalance < amount) {
          throw new CaillouError(pickPhrase("give_broke", { amount }));
        }

        const debited = await client.query<{ balance: number }>(
          "UPDATE users SET balance = balance - $2 WHERE discord_id = $1 RETURNING balance",
          [fromId, amount],
        );
        await client.query(
          "UPDATE users SET balance = balance + $2 WHERE discord_id = $1",
          [toId, amount],
        );
        await writeTransaction(client, fromId, -amount, `give:out:${toId}`);
        await writeTransaction(client, toId, amount, `give:in:${fromId}`);

        return { balance: debited.rows[0]?.balance ?? fromBalance - amount };
      });
    },

    async leaderboard(limit = 10) {
      const { rows } = await db.query<{ discord_id: string; balance: number }>(
        `SELECT discord_id, balance
           FROM users
          WHERE balance > 0
          ORDER BY balance DESC, discord_id
          LIMIT $1`,
        [limit],
      );
      return rows.map((r) => ({ discordId: r.discord_id, balance: r.balance }));
    },

    async adjust(userId, delta, reason) {
      return db.withTransaction(async (client) => {
        const balance = await ensureAndLock(client, userId);
        const next = balance + delta;
        if (next < 0) {
          throw new CaillouError(
            "Ajustement refusé : le solde deviendrait négatif. Le Caillou ne fait pas crédit.",
          );
        }
        const { rows } = await client.query<{ balance: number }>(
          "UPDATE users SET balance = $2 WHERE discord_id = $1 RETURNING balance",
          [userId, next],
        );
        await writeTransaction(client, userId, delta, `admin:${reason}`);
        return { balance: rows[0]?.balance ?? next };
      });
    },
  };
};
