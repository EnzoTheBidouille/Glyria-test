// Cœur de l'économie. INVARIANT : toute variation de balance passe par une
// transaction DB et écrit une ligne dans `transactions`. Verrouillage par ligne
// (SELECT … FOR UPDATE) pour éviter les races sur le solde.
// Auto-importé globalement (`useEconomy`).
import type { PoolClient } from "pg";
import type { EconomyStats, LeaderboardEntry, TransactionEntry } from "../types.js";

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
  /** Offrande quotidienne (UTC) avec série. Jette si déjà réclamée aujourd'hui. */
  claimDaily(userId: string): Promise<{ amount: number; streak: number; balance: number }>;
  /** Dernières écritures du journal pour un membre. */
  history(userId: string, limit?: number): Promise<TransactionEntry[]>;
  /** Agrégats pour /stats. */
  stats(): Promise<EconomyStats>;
  /** Top des poussières GAGNÉES (hors transferts/remboursements) sur une fenêtre. */
  earnedTop(since: Date, until: Date | null, limit?: number): Promise<LeaderboardEntry[]>;
  /** Solde net des jeux d'argent (pari + duel) depuis le début du jour UTC. */
  netBetToday(userId: string): Promise<number>;
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
      const base =
        Math.floor(Math.random() * (earn.max - earn.min + 1)) + earn.min;
      // Humeur du jour × pluie de météorites éventuelle.
      const multiplier = useMood().multiplier() * useEvents().earnMultiplier();
      const award = Math.max(0, Math.round(base * multiplier));
      if (award === 0) {
        const balance = await this.balanceOf(userId);
        return { awarded: 0, balance };
      }

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

    async claimDaily(userId) {
      const { claim } = useConfig();
      return db.withTransaction(async (client) => {
        await ensureAndLock(client, userId);
        const { rows } = await client.query<{
          last_claim_at: Date | null;
          claim_streak: number;
        }>(
          "SELECT last_claim_at, claim_streak FROM users WHERE discord_id = $1",
          [userId],
        );
        const state = rows[0];

        const today = utcDayKey();
        const yesterday = utcDayKey(new Date(Date.now() - 86_400_000));
        const lastDay = state?.last_claim_at ? utcDayKey(state.last_claim_at) : null;

        if (lastDay === today) {
          throw new CaillouError(pickPhrase("offrande_already"));
        }

        const streak = lastDay === yesterday ? (state?.claim_streak ?? 0) + 1 : 1;
        const countedDays = Math.min(streak, claim.streakCapDays);
        const amount = claim.base + claim.streakBonus * (countedDays - 1);

        const updated = await client.query<{ balance: number }>(
          `UPDATE users
              SET balance = balance + $2, last_claim_at = now(), claim_streak = $3
            WHERE discord_id = $1
          RETURNING balance`,
          [userId, amount, streak],
        );
        await writeTransaction(client, userId, amount, "offrande");
        return { amount, streak, balance: updated.rows[0]?.balance ?? amount };
      });
    },

    async history(userId, limit = 10) {
      const { rows } = await db.query<{ delta: number; reason: string; created_at: Date }>(
        `SELECT delta, reason, created_at
           FROM transactions
          WHERE user_id = $1
          ORDER BY created_at DESC, id DESC
          LIMIT $2`,
        [userId, limit],
      );
      return rows.map((r) => ({ delta: r.delta, reason: r.reason, createdAt: r.created_at }));
    },

    async earnedTop(since, until, limit = 10) {
      // Poussière réellement gagnée : on exclut les transferts entrants (déjà
      // comptés chez l'émetteur) et les remboursements (annulations d'achat).
      const { rows } = await db.query<{ user_id: string; earned: number }>(
        `SELECT user_id, SUM(delta)::bigint AS earned
           FROM transactions
          WHERE delta > 0
            AND created_at >= $1
            AND ($2::timestamptz IS NULL OR created_at < $2)
            AND reason NOT LIKE 'give:in:%'
            AND reason NOT LIKE 'refund:%'
          GROUP BY user_id
          ORDER BY earned DESC, user_id
          LIMIT $3`,
        [since, until, limit],
      );
      return rows.map((r) => ({ discordId: r.user_id, balance: r.earned }));
    },

    async netBetToday(userId) {
      const now = new Date();
      const dayStart = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      );
      const { rows } = await db.query<{ net: number | null }>(
        `SELECT SUM(delta)::bigint AS net
           FROM transactions
          WHERE user_id = $1
            AND created_at >= $2
            AND (reason LIKE 'pari:%' OR reason LIKE 'duel:%')`,
        [userId, dayStart],
      );
      return rows[0]?.net ?? 0;
    },

    async stats() {
      const [totals, richest, weekly, taxed] = await Promise.all([
        db.query<{ total: number | null; users: number; txs: number }>(
          `SELECT (SELECT SUM(balance) FROM users)::bigint AS total,
                  (SELECT COUNT(*) FROM users)::bigint     AS users,
                  (SELECT COUNT(*) FROM transactions)::bigint AS txs`,
        ),
        this.leaderboard(1),
        this.earnedTop(new Date(Date.now() - 7 * 86_400_000), null, 1),
        db.query<{ destroyed: number | null }>(
          "SELECT (-SUM(delta))::bigint AS destroyed FROM transactions WHERE reason = 'taxe_cosmique'",
        ),
      ]);
      const t = totals.rows[0];
      return {
        totalDust: t?.total ?? 0,
        userCount: t?.users ?? 0,
        transactionCount: t?.txs ?? 0,
        richest: richest[0] ?? null,
        weeklyTop: weekly[0] ?? null,
        destroyedByTax: taxed.rows[0]?.destroyed ?? 0,
      };
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
