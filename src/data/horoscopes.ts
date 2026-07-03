// Ingrédients de l'horoscope cosmique. La composition est déterministe par
// (membre, jour UTC) — voir commands/horoscope.ts — pour que chacun garde la
// même prédiction toute la journée et puisse comparer avec les autres.

/** Signes du zodiaque minéral : attribués à vie par hash de l'ID Discord. */
export const SIGNS = [
  { name: "Gravier Ascendant", emoji: "🪨" },
  { name: "Silex Rétrograde", emoji: "🔥" },
  { name: "Quartz Fêlé", emoji: "💎" },
  { name: "Galet Errant", emoji: "🌊" },
  { name: "Obsidienne Boudeuse", emoji: "🌑" },
  { name: "Granit Contrarié", emoji: "⛰️" },
  { name: "Meteorite Naine", emoji: "☄️" },
  { name: "Sable Mouvant", emoji: "⏳" },
  { name: "Stalactite Anxieuse", emoji: "🧊" },
  { name: "Poussière Prétentieuse", emoji: "✨" },
  { name: "Basalte Passif-Agressif", emoji: "🌋" },
  { name: "Calcaire Décevant", emoji: "🦴" },
] as const;

/** Prédictions du jour. {name} est interpolé. */
export const PREDICTIONS = [
  "Les astres sont formels : tu vas encore dire un truc gênant avant midi. Ils ont hâte.",
  "Jupiter s'aligne avec ta médiocrité. C'est rare. Rate pas ça.",
  "Aujourd'hui, évite les décisions importantes. Et les décisions en général. Repose-toi sur tes échecs acquis.",
  "Une opportunité va passer près de toi. Elle ne s'arrêtera pas, mais tu sentiras le courant d'air.",
  "Le cosmos te conseille la discrétion. Le cosmos te conseille ça tous les jours, en fait.",
  "Grande énergie aujourd'hui. Malheureusement, aucune direction. Comme d'habitude.",
  "Tu vas briller en société. Comme une pierre : en restant immobile et silencieux. Essaie.",
  "Vénus te tourne le dos. Vénus a bon goût.",
  "Un inconnu pensera du bien de toi aujourd'hui. Il ne te connaît pas encore, voilà tout.",
  "Les poussières s'alignent : journée idéale pour donner ta fortune à plus méritant. Genre n'importe qui.",
  "Attention aux erreurs d'inattention. Et aux erreurs d'attention. Bref, attention à toi.",
  "Ton aura est particulièrement terne ce matin. Les astres ont vérifié deux fois.",
  "Mercure rétrograde. Toi aussi, mais chez toi c'est permanent.",
  "Le Caillou voit une grande réussite dans ton avenir. Très loin. Au télescope. Peut-être une tache sur la lentille.",
  "Aujourd'hui tu apprendras quelque chose. Probablement à tes dépens, mais c'est déjà de l'apprentissage.",
  "Alignement rarissime : personne ne te jugera aujourd'hui. Le Caillou, si. Toujours.",
] as const;

/** Conseils du jour, catégorie bonus. */
export const ADVICE = [
  "Chiffre porte-malheur : le tien.",
  "Couleur du jour : gris roche. Assortie à tes perspectives.",
  "Compatibilité du jour : les minéraux. Uniquement les minéraux.",
  "Objet à éviter : le miroir.",
  "Action recommandée : /offrande. Au moins tu repartiras avec quelque chose.",
  "Mantra du jour : « je suis poussière, et c'est déjà ambitieux ».",
  "Investissement conseillé : aucun. On a vu ton historique.",
  "Heure de chance : 04h12. Dommage que tu dormes.",
] as const;
