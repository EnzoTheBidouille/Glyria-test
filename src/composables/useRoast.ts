// ─────────────────────────────────────────────────────────────────────────────
// TIER 2 — Générateur de roasts LOCAL (combinatoire, zéro appel réseau).
//
// Assemble une pique aléatoire en français : [ouverture] + [corps contextuel]
// + [chute optionnelle], à partir des ingrédients de `src/data/roasts.ts`.
// Le contexte (ex. "wallet_zero", tel que renvoyé par `walletTier()`) choisit
// le pool de corps ; tout contexte inconnu retombe sur le pool générique.
//
// Pattern d'usage côté commande (fallback Tier 1 conservé) :
//   const text = (await useRoast()?.generate(input)) ?? pickPhrase(context, vars);
//
// Brancher un jour l'API Anthropic = remplacer `generate` en gardant ce contrat.
// ─────────────────────────────────────────────────────────────────────────────
import {
  ROAST_BODIES,
  ROAST_OPENERS,
  ROAST_PUNCHLINES,
} from "../data/roasts.js";
import { interpolate } from "../utils/personality.js";

export interface RoastInput {
  /** Contexte d'invocation : "wallet_zero", "give", "buy", "generic"… */
  context: string;
  /** Membre visé par le roast. */
  userId: string;
  vars?: Record<string, string | number>;
}

export interface RoastGenerator {
  generate(input: RoastInput): Promise<string>;
}

const pick = <T>(pool: readonly T[]): T =>
  pool[Math.floor(Math.random() * pool.length)]!;

export const useRoast = (): RoastGenerator | null => ({
  async generate({ context, vars }) {
    const bodies = ROAST_BODIES[context] ?? ROAST_BODIES.generic!;
    const parts = [pick(ROAST_OPENERS), pick(bodies)];
    // Deux fois sur trois, une chute ; le reste du temps le silence méprisant.
    if (Math.random() < 2 / 3) parts.push(pick(ROAST_PUNCHLINES));
    return interpolate(parts.join(" "), vars);
  },
});
