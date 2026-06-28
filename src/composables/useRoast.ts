// ─────────────────────────────────────────────────────────────────────────────
// TIER 2 — STUB UNIQUEMENT. NE PAS IMPLÉMENTER EN v1.
//
// Couture propre pour brancher plus tard une génération de roasts via l'API
// Anthropic (modèles claude-*). En v1, `useRoast()` renvoie `null` et les
// commandes retombent sur `pickPhrase()` (Tier 1, coût zéro).
//
// Aucun appel réseau n'est effectué ici. Pattern d'usage côté commande :
//   const text = (await useRoast()?.generate(input)) ?? pickPhrase(context, vars);
// ─────────────────────────────────────────────────────────────────────────────

export interface RoastInput {
  /** Contexte d'invocation : "wallet", "give", "buy", "error"… */
  context: string;
  /** Membre visé par le roast. */
  userId: string;
  /** Variables additionnelles (solde, montant, cible…). */
  vars?: Record<string, string | number>;
}

export interface RoastGenerator {
  generate(input: RoastInput): Promise<string>;
}

// TODO(Tier 2): retourner une implémentation appelant l'API Anthropic.
// Garder le contrat ci-dessus inchangé pour ne rien casser côté commandes.
export const useRoast = (): RoastGenerator | null => null;
