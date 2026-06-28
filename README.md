# 🪨 Le Caillou Magique

Bot Discord de la communauté **Caillou Cosmique**. Le bot incarne un caillou
cosmique sensible, sarcastique et mesquin, qui fait tourner l'économie du serveur
à la **poussière d'étoile**.

Construit avec **[glyria.js](https://js.glyria.app)** (`@glyria/bot`), un framework
file-based au-dessus de discord.js v14.

> **Périmètre v1** : uniquement l'économie poussière d'étoile + la boutique de perks.
> Pas de TFT, pas de jeux de stream, pas d'appel LLM. (Le « roast » via API est
> seulement esquissé — voir `src/composables/useRoast.ts`.)

## Fonctionnalités

- **Gain passif** : 1–3 poussières par message, avec un cooldown par membre
  (60 s par défaut, configurable) pour empêcher le spam de minter de la monnaie.
- **Commandes** : `/wallet`, `/give`, `/classement`, `/boutique`, `/acheter`,
  `/caillou-admin`.
- **Boutique** : rôle de couleur (7 j), L'Élu du Caillou (rôle prestige à
  détenteur unique), renommage d'un salon autorisé (1 h), statut custom du bot (1 h).
  **Tous les perks expirent automatiquement et sont révocables par un admin.**
- **Audit** : chaque variation de solde écrit une ligne dans `transactions`.
  Les modifications passent par des transactions SQL avec `SELECT … FOR UPDATE`.

## Prérequis

- **Node.js ≥ 22**
- **PostgreSQL** (un `docker-compose.yml` fournit une base locale)
- Une application Discord avec un bot

## Configuration Discord

1. Crée une application sur le
   [Discord Developer Portal](https://discord.com/developers/applications) →
   **Bot** → **Reset Token** pour obtenir le jeton.
2. **Privileged Gateway Intents** : active **SERVER MEMBERS INTENT**
   (nécessaire pour attribuer les rôles / réassigner le prestige).
   *MESSAGE CONTENT n'est PAS requis* — le gain ne lit que l'auteur et l'horodatage.
3. Invite le bot avec les scopes `bot` + `applications.commands` et les
   permissions : *Manage Roles*, *Manage Channels* (pour le renommage),
   *Send Messages*.
4. **Pré-crée dans Discord** les rôles utilisés par la boutique
   (rôle de couleur, rôle « L'Élu du Caillou »), **positionnés sous le rôle le
   plus haut du bot** (sinon il ne pourra pas les attribuer), et récupère leurs IDs.

## Variables d'environnement

Copie `.env.example` en `.env` et remplis :

| Variable                | Requis | Description                                                                 |
| ----------------------- | :----: | --------------------------------------------------------------------------- |
| `TOKEN`                 |   ✅   | Jeton du bot. ⚠️ glyria **impose** ce nom (et non `DISCORD_TOKEN`).          |
| `DATABASE_URL`          |   ✅   | Chaîne de connexion PostgreSQL.                                             |
| `GUILD_ID`              |   ✅   | ID du serveur où le bot opère.                                              |
| `COLOR_ROLE_ID`         |   ⚠️   | ID du rôle de couleur (requis pour le perk `couleur`).                      |
| `PRESTIGE_ROLE_ID`      |   ⚠️   | ID du rôle prestige (requis pour le perk `elu`).                            |
| `RENAME_WHITELIST`      |   ⚠️   | IDs de salons renommables, séparés par des virgules. Aucun autre n'est touché. |
| `DEFAULT_STATUS`        |        | Statut par défaut du bot (défaut : « rumine dans le vide cosmique »).        |
| `EARN_MIN`              |        | Gain minimum par message (défaut : 1).                                      |
| `EARN_MAX`              |        | Gain maximum par message (défaut : 3).                                      |
| `EARN_COOLDOWN_SECONDS` |        | Cooldown de gain par membre, en secondes (défaut : 60).                     |

> Les colonnes ⚠️ ne bloquent pas le démarrage du bot, mais le perk correspondant
> échouera (avec sarcasme) tant qu'elles ne sont pas renseignées.

## Installation & démarrage

```bash
# 1. Dépendances
npm install

# 2. Base de données locale (Docker)
docker compose up -d db

# 3. Migrations (crée les tables + seed des 4 articles de boutique)
npm run migrate

# 4a. Développement (hot reload)
npm run dev

# 4b. Production
npm run build
npm run start
```

> En production, `npm run start` (= `glyria start`) lance `dist/index.js`, qui
> **rejoue les migrations au démarrage** (idempotent) avant de se connecter.

## Enregistrement des commandes slash

glyria **enregistre automatiquement** les commandes au `login()` — il n'y a pas de
script REST à lancer. Au premier démarrage, laisse quelques instants à Discord
pour propager les commandes **globales** (jusqu'à ~1 h dans le pire cas ; souvent
bien plus rapide). Le `GUILD_ID` sert au bot pour résoudre membres / rôles / salons,
pas au scoping de l'enregistrement (non exposé par glyria à ce jour).

## Commandes

| Commande                          | Description                                              |
| --------------------------------- | -------------------------------------------------------- |
| `/wallet`                         | Affiche ton solde (éphémère) avec un commentaire acide.  |
| `/give <destinataire> <montant>`  | Transfère de la poussière (refuse auto-don, négatif, découvert). |
| `/classement`                     | Top 10 des soldes.                                       |
| `/boutique`                       | Liste les perks et leur coût.                            |
| `/acheter couleur`                | Rôle de couleur, 7 jours.                                |
| `/acheter elu`                    | Devenir L'Élu du Caillou (détrône l'actuel).             |
| `/acheter renommer <nom> [salon]` | Renomme un salon autorisé, 1 h. `salon` = ID (sinon le 1er autorisé). |
| `/acheter statut <texte>`         | Impose un statut au bot, 1 h.                            |
| `/caillou-admin ajuster`          | (ManageGuild) Corrige un solde, audité.                  |
| `/caillou-admin revoquer <id>`    | (ManageGuild) Révoque un perk actif et annule son effet. |
| `/caillou-admin solde <membre>`   | (ManageGuild) Consulte un solde.                         |

## Modèle de données

- **`users`** — `discord_id`, `balance` (BIGINT ≥ 0), `last_earn_at`.
- **`transactions`** — journal d'audit : `delta`, `reason`, `created_at`.
- **`shop_items`** — `cost`, `type`, `config` (jsonb : durée, clé d'env du rôle…).
- **`active_perks`** — `expires_at`, `revert` (jsonb : données d'annulation).

Migrations SQL réelles dans `db/migrations/`. Le balayage d'expiration tourne
toutes les 60 s (`src/composables/useSweep.ts`).

## Déploiement (Dokploy / VPS)

Le `Dockerfile` est multi-étapes (build → runtime slim, un seul process). Sur
Dokploy : pointe vers ce dépôt, fournis les variables d'environnement, et branche
une base Postgres (le service `db` du compose, ou une base managée). Le conteneur
joue les migrations au démarrage.

```bash
# Tout en local via Docker (bot + Postgres)
docker compose up --build
```

## Personnalité

- **Tier 1 (actif)** : pool de phrases pondérées en français dans
  `src/data/phrases.ts`, tirées par `pickPhrase()` — zéro coût API.
- **Tier 2 (esquisse seulement)** : `src/composables/useRoast.ts` expose une
  interface `RoastGenerator` renvoyant `null` en v1. Brancher l'API Anthropic ici
  plus tard sans toucher au reste.

## Structure

```
src/
  commands/   wallet, give, classement, boutique, acheter, admin
  events/     ready (statut + sweep), messageCreate (gain)
  composables/ useConfig, useDb, useEconomy, useShop, usePerks, useSweep, useClient, useRoast
  utils/      personality, format, respond, errors
  data/       phrases
  db/         migrator, migrate-cli
  index.ts
db/migrations/  0001_init.sql, 0002_seed_shop.sql
```
