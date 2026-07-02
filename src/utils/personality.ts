// Couche de personnalité Tier 1 : tirage pondéré + interpolation de variables.
// Auto-importé globalement (`pickPhrase`). Aucun coût API.
import { PHRASES } from "../data/phrases.js";
import type { Phrase } from "../types.js";
import type { PhraseKey } from "../data/phrases.js";

export type { PhraseKey };

export type PhraseVars = Record<string, string | number>;

/** Remplace les {variables} d'un gabarit. Partagé avec le générateur de roasts. */
export function interpolate(text: string, vars?: PhraseVars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = vars[key];
    return value != null ? String(value) : `{${key}}`;
  });
}

/** Tire une phrase pondérée pour un contexte donné et interpole les variables. */
export const pickPhrase = (context: PhraseKey, vars?: PhraseVars): string => {
  const pool: readonly Phrase[] = PHRASES[context];
  const total = pool.reduce((sum, p) => sum + p.weight, 0);

  let roll = Math.random() * total;
  for (const phrase of pool) {
    roll -= phrase.weight;
    if (roll <= 0) return interpolate(phrase.text, vars);
  }
  // Filet de sécurité (les pools sont non vides par construction).
  return interpolate(pool[0]?.text ?? "", vars);
};

/** Aide au choix du ton de /wallet selon le solde. */
export const walletTier = (balance: number): PhraseKey => {
  if (balance <= 0) return "wallet_zero";
  if (balance >= 1000) return "wallet_rich";
  return "wallet_some";
};
