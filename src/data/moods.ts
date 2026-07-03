// Humeurs quotidiennes du Caillou. Le multiplicateur s'applique au gain passif
// (arrondi au plus proche, minimum 0). Tiré de façon déterministe par jour UTC
// (voir composables/useMood.ts) : tout le monde voit la même humeur.
import type { Mood } from "../types.js";

export const MOODS: readonly Mood[] = [
  {
    key: "magnanime",
    label: "Magnanime",
    emoji: "🌤️",
    multiplier: 1.5,
    description:
      "Le Caillou a bien dormi (4 millions d'années). Il distribue la poussière avec un mépris presque affectueux.",
  },
  {
    key: "blase",
    label: "Blasé",
    emoji: "🌫️",
    multiplier: 1,
    description:
      "Journée standard. Le Caillou vous regarde vous agiter. Rien ne change, comme d'habitude.",
  },
  {
    key: "vindicatif",
    label: "Vindicatif",
    emoji: "🌩️",
    multiplier: 0.75,
    description:
      "Quelqu'un a marché sur le Caillou pendant la nuit. Tout le monde paie. La poussière tombe au compte-gouttes.",
  },
  {
    key: "euphorie",
    label: "Euphorie cosmique",
    emoji: "💫",
    multiplier: 2,
    description:
      "Alignement planétaire favorable. Le Caillou déborde de poussière et de condescendance. Profitez, ça ne durera pas.",
  },
  {
    key: "migraine",
    label: "Migraine tectonique",
    emoji: "🌋",
    multiplier: 0.5,
    description:
      "Les plaques bougent, le Caillou souffre. Vos gains aussi. Ne venez pas vous plaindre, il a 4,5 milliards d'années d'ancienneté.",
  },
  {
    key: "nostalgique",
    label: "Nostalgique du Big Bang",
    emoji: "🌌",
    multiplier: 1.25,
    description:
      "Le Caillou repense à l'époque où tout était plasma et où vous n'existiez pas. C'était mieux. Il paie un peu plus pour oublier.",
  },
] as const;
