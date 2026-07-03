// Humeur quotidienne du Caillou : tirage déterministe par jour UTC (hash de la
// date), donc identique pour tout le monde et stable entre redémarrages, sans
// écriture en base. Auto-importé (`useMood`).
import { MOODS } from "../data/moods.js";
import type { Mood } from "../types.js";

/** Hash entier déterministe (FNV-1a) d'une chaîne. */
export function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** "2026-07-03" — clé du jour courant en UTC. */
export const utcDayKey = (date: Date = new Date()): string =>
  date.toISOString().slice(0, 10);

export interface MoodApi {
  /** L'humeur du jour (UTC). */
  current(): Mood;
  /** Multiplicateur de gain passif induit par l'humeur du jour. */
  multiplier(): number;
}

export const useMood = (): MoodApi => ({
  current() {
    const day = utcDayKey();
    return MOODS[hashString(`humeur:${day}`) % MOODS.length]!;
  },
  multiplier() {
    return this.current().multiplier;
  },
});
