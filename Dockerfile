# ── Build ─────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json glyria.config.ts ./
COPY src ./src
COPY db ./db

# glyria build = glyria generate (.glyria/) + tsc (dist/)
RUN npm run build
# On retire les dépendances de dev une fois le build terminé.
RUN npm prune --omit=dev

# ── Runtime ───────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY glyria.config.ts ./glyria.config.ts
# Les fichiers .sql sont lus au runtime par le migrateur (cwd/db/migrations).
COPY db ./db

# `glyria start` lance dist/index.js : migrations idempotentes puis connexion.
CMD ["npm", "run", "start"]
