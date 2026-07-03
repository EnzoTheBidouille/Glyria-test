# 🪨 Le Caillou Magique

Bot Discord de la communauté **Caillou Cosmique**. Le bot incarne un caillou
cosmique sensible, sarcastique et mesquin, qui fait tourner l'économie du serveur
à la **poussière d'étoile**.

Construit avec **[glyria.js](https://js.glyria.app)** (`@glyria/bot`), un framework
file-based au-dessus de discord.js v14.

> **Périmètre v1** : uniquement l'économie poussière d'étoile + la boutique de perks.
> Pas de TFT, pas de jeux de stream, pas d'appel LLM. (Le « roast » est généré
> localement, sans API — voir `src/composables/useRoast.ts`.)

## Fonctionnalités

- **Gain passif** : 1–3 poussières par message, avec un cooldown par membre
  (60 s par défaut, configurable) pour empêcher le spam de minter de la monnaie.
- **Commandes** : `/wallet`, `/give`, `/classement`, `/roast`, `/boutique`,
  `/acheter`, `/offrande`, `/parier`, `/duel`, `/historique`, `/stats`,
  `/horoscope`, `/humeur`, `/pantheon`, `/caillou-admin`.
- **Humeur quotidienne** : le Caillou change d'humeur chaque jour (UTC) et
  module les gains passifs (×0,5 à ×2). Consultable via `/humeur`.
- **Événements cosmiques** (si `EVENTS_CHANNEL_ID` est configuré) : pluie de
  météorites (~toutes les 6 h, gains ×2 pendant 10 min) et taxe cosmique
  (~1/jour, le plus riche perd 5-10 %, poussière détruite).
- **Saisons** : chaque lundi 00:00 UTC, le plus gros gagnant de la semaine
  écoulée entre au Panthéon (`/pantheon`) et est couronné publiquement.
- **Interjections** : rare pique spontanée sur un message (probabilité et
  cooldown par salon configurables).
- **Boutique** : rôle de couleur (7 j), L'Élu du Caillou (rôle prestige à
  détenteur unique), renommage d'un salon autorisé (1 h), statut custom du bot (1 h).
  **Tous les perks expirent automatiquement et sont révocables par un admin.**
  Racheter un rôle de couleur déjà actif **prolonge** sa durée. Les perks qui se
  superposent (deux statuts, deux renommages du même salon) se défont proprement :
  l'expiration de l'un réapplique le plus récent encore payé, et le statut acheté
  survit à un redémarrage du bot.
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
| `EVENTS_CHANNEL_ID`     |   ⚠️   | Salon des annonces (météorites, taxe cosmique, couronnement hebdo). **Sans lui, ces événements sont désactivés.** |
| `BET_MAX_STAKE`         |        | Mise maximale par pari / duel (défaut : 250).                               |
| `BET_DAILY_LOSS_CAP`    |        | Pertes nettes maximales par jour UTC, pari + duel (défaut : 500).           |
| `CLAIM_BASE`            |        | Montant de base de `/offrande` (défaut : 25).                               |
| `CLAIM_STREAK_BONUS`    |        | Bonus d'offrande par jour de série (défaut : 5).                            |
| `CLAIM_STREAK_CAP_DAYS` |        | Plafond de la série comptée (défaut : 7).                                   |
| `INTERJECTION_PERCENT`  |        | % de chance qu'un message déclenche une pique spontanée, 0 = jamais (défaut : 1). |
| `INTERJECTION_COOLDOWN_SECONDS` | | Silence minimal entre deux piques dans un même salon (défaut : 600).       |

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
| `/roast [cible]`                  | Roast public généré (sans cible : toi-même). Gratuit.    |
| `/boutique`                       | Liste les perks et leur coût.                            |
| `/acheter couleur`                | Rôle de couleur, 7 jours.                                |
| `/acheter elu`                    | Devenir L'Élu du Caillou (détrône l'actuel).             |
| `/acheter renommer <nom> [salon]` | Renomme un salon autorisé, 1 h. `salon` = #mention, nom ou ID (sinon le 1er autorisé). |
| `/acheter statut <texte>`         | Impose un statut au bot, 1 h.                            |
| `/acheter maudire <cible> <pseudo>` | Rebaptise un membre, 1 h. Bloqué par le Bouclier de basalte. Nécessite la permission « Gérer les pseudos » pour le bot. |
| `/acheter bouclier`               | 24 h d'immunité contre `/roast` et les malédictions.     |
| `/offrande`                       | Aumône quotidienne (UTC), avec série qui grossit le montant. |
| `/parier <choix> <montant>`       | Pile ou face. Gain ×2, 48 % de victoire, mise et pertes/jour plafonnées. |
| `/duel <adversaire> <montant>`    | Duel consenti par boutons (60 s) : mise contre mise, le gagnant rafle tout. |
| `/historique`                     | Tes 10 dernières transactions (éphémère).                |
| `/stats`                          | Macro-économie du serveur (masse, plus riche, taxe…).    |
| `/horoscope`                      | Prédiction du jour, déterministe par membre et par jour. |
| `/humeur`                         | Humeur du jour du Caillou et multiplicateur de gains.    |
| `/classement semaine:true`        | Top des gains des 7 derniers jours.                      |
| `/pantheon`                       | Les couronnés hebdomadaires.                             |
| `/caillou-admin ajuster`          | (ManageGuild) Corrige un solde, audité.                  |
| `/caillou-admin revoquer <id>`    | (ManageGuild) Révoque un perk actif et annule son effet. |
| `/caillou-admin solde <membre>`   | (ManageGuild) Consulte un solde.                         |

## Modèle de données

- **`users`** — `discord_id`, `balance` (BIGINT ≥ 0), `last_earn_at`,
  `last_claim_at`, `claim_streak`.
- **`transactions`** — journal d'audit : `delta`, `reason`, `created_at`.
- **`shop_items`** — `cost`, `type`, `config` (jsonb : durée, clé d'env du rôle…).
- **`active_perks`** — `expires_at`, `revert` (jsonb : données d'annulation).
- **`app_state`** — clé/valeur jsonb (météorites en cours, dernière saison…).
- **`hall_of_fame`** — vainqueur hebdomadaire : `season`, `user_id`, `earned`.

Migrations SQL réelles dans `db/migrations/`. Le balayage d'expiration tourne
toutes les 60 s (`src/composables/useSweep.ts`) et cadence aussi les événements
cosmiques (`useEvents`) et les saisons (`useSeasons`).

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
- **Tier 2 (actif, local)** : `src/composables/useRoast.ts` assemble des roasts
  aléatoires (ouverture + corps contextuel + chute) à partir des ingrédients de
  `src/data/roasts.ts` — toujours zéro coût API. `/wallet` alterne 50/50 entre
  les deux tiers. Brancher l'API Anthropic plus tard = remplacer `generate()`
  en gardant le contrat `RoastGenerator`.

## Structure

```
src/
  commands/   wallet, give, classement, roast, boutique, acheter, admin,
              offrande, parier, duel, historique, stats, horoscope, humeur, pantheon
  events/     ready (statut + sweep), messageCreate (gain + interjections)
  composables/ useConfig, useDb, useEconomy, useShop, usePerks, useSweep, useClient,
               useRoast, useMood, useEvents, useSeasons, useAppState
  utils/      personality, format, respond, errors
  data/       phrases, roasts, moods, horoscopes
  db/         migrator, migrate-cli
  index.ts
db/migrations/  0001_init.sql, 0002_seed_shop.sql, 0003_features.sql
```
