-- 0001_init — schéma de base de l'économie "poussière d'étoile".

-- Comptes des membres. La balance ne peut jamais devenir négative.
CREATE TABLE IF NOT EXISTS users (
    discord_id   TEXT PRIMARY KEY,
    balance      BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
    last_earn_at TIMESTAMPTZ
);

-- Journal d'audit : CHAQUE variation de balance écrit une ligne ici.
-- Sert à reconstituer/annuler les exploits.
CREATE TABLE IF NOT EXISTS transactions (
    id         BIGSERIAL PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users (discord_id) ON DELETE CASCADE,
    delta      BIGINT NOT NULL,
    reason     TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions (created_at DESC);

-- Articles de la boutique. `config` (jsonb) porte les données statiques du perk
-- (durée, clé d'env vers l'ID Discord, drapeau singleHolder…).
CREATE TABLE IF NOT EXISTS shop_items (
    id     TEXT PRIMARY KEY,
    name   TEXT NOT NULL,
    cost   BIGINT NOT NULL CHECK (cost >= 0),
    type   TEXT NOT NULL,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Perks actifs. `revert` (jsonb) stocke ce qu'il faut pour défaire le perk
-- (nom de salon d'origine, ancien statut, ID de rôle/salon ciblé…).
CREATE TABLE IF NOT EXISTS active_perks (
    id         BIGSERIAL PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users (discord_id) ON DELETE CASCADE,
    item_id    TEXT NOT NULL REFERENCES shop_items (id),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    revert     JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_active_perks_expires ON active_perks (expires_at);
CREATE INDEX IF NOT EXISTS idx_active_perks_user ON active_perks (user_id);

-- Classement : index sur la balance décroissante.
CREATE INDEX IF NOT EXISTS idx_users_balance ON users (balance DESC);
