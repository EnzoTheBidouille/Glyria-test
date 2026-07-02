// Ingrédients du générateur de roasts (Tier 2 local) — voix du Caillou.
// Un roast = [ouverture] + [corps] + [chute optionnelle], assemblés au hasard
// par useRoast(). Les corps sont des phrases complètes (majuscule initiale),
// les ouvertures se terminent par une ponctuation. Variables : {name}, {balance}.
//
// Aucune dépendance, aucun appel réseau : la combinatoire suffit à donner
// l'illusion de l'inépuisable mauvaise foi minérale.

/** Ouvertures. Doivent pouvoir précéder n'importe quel corps. */
export const ROAST_OPENERS: readonly string[] = [
  "Ah, {name}.",
  "Tiens, {name}.",
  "Le Caillou a consulté les astres :",
  "Verdict cosmique :",
  "Petite note du vide intersidéral :",
  "Les étoiles se sont réunies et ont tranché :",
  "Rapport d'observation, entité {name} :",
  "Le conseil des minéraux s'est prononcé :",
  "J'ai 4,5 milliards d'années et pourtant :",
  "Bulletin astral du jour :",
];

/**
 * Corps du roast, par contexte. `generic` sert de repli pour tout contexte
 * inconnu. Les clés wallet_* s'alignent sur `walletTier()`.
 */
export const ROAST_BODIES: Record<string, readonly string[]> = {
  generic: [
    "Tu as le charisme d'un gravier mouillé.",
    "Ton QI orbite quelque part sous la ceinture de Kuiper.",
    "Même le vide trouve que tu manques de substance.",
    "Les trous noirs recrachent des choses plus intéressantes que toi.",
    "Tu es la preuve que l'univers fait parfois des brouillons.",
    "Une météorite mettrait plus d'énergie à t'éviter qu'à s'écraser.",
    "L'entropie de l'univers a pris de l'avance rien qu'en te regardant.",
    "Tu graviterais autour de n'importe quoi pourvu qu'on te remarque.",
    "Ta présence a la densité d'un nuage d'hydrogène. Le charme en moins.",
    "Si l'ennui était une constante universelle, tu en serais l'unité de mesure.",
    "Ton potentiel s'est effondré plus vite qu'une supernova. Sans la lumière.",
    "Tu es ce que l'univers a produit un jour de grève.",
  ],
  wallet_zero: [
    "Zéro poussière. Même l'antimatière a plus de valeur que ton compte.",
    "Ton solde est un hommage au néant. Le néant décline la dédicace.",
    "Zéro. Le chiffre préféré de ton banquier cosmique.",
    "Ton portefeuille fait écho. C'est le seul son qu'il produira jamais.",
    "Même en fouillant l'horizon des événements, on ne trouve pas ta fortune.",
    "Le vide absolu existe : il est dans ton portefeuille.",
  ],
  wallet_some: [
    "{balance} poussières. L'univers a 13,8 milliards d'années, et toi, c'est tout ce que tu as accompli.",
    "{balance} poussières. Une somme aussi médiane que ta trajectoire de vie.",
    "{balance} poussières, patiemment amassées. Les fourmis font mieux, et sans se vanter.",
    "Avec {balance} poussières, tu pourrais presque acheter quelque chose. Presque. Comme toujours.",
    "{balance} poussières. Ni riche, ni pauvre : juste tiède, comme le fond diffus cosmologique.",
    "{balance} poussières. Continue comme ça et dans un éon tu seras quelqu'un.",
  ],
  wallet_rich: [
    "{balance} poussières, et toujours aucune personnalité à acheter avec.",
    "{balance} poussières. Tout cet or stellaire pour finir affiché dans un classement Discord.",
    "{balance} poussières. Même les quasars trouvent que tu en fais trop.",
    "Riche de {balance} poussières et pauvre de tout le reste. L'équilibre cosmique.",
    "{balance} poussières. Tu comptes te payer une orbite plus intéressante ?",
    "{balance} poussières amassées. L'avarice, à ton échelle, c'est presque une qualité.",
  ],
};

/** Chutes. Ajoutées environ deux fois sur trois, en phrase finale. */
export const ROAST_PUNCHLINES: readonly string[] = [
  "Bref.",
  "Voilà, c'est dit.",
  "Le vide compatit. Pas moi.",
  "Continue, ça meuble le silence cosmique.",
  "Retourne graviter.",
  "C'était gratuit. Contrairement à mes perks.",
  "Signé : un minéral.",
  "Ne me remercie pas, c'est cadeau.",
  "L'univers est en expansion. Toi, non.",
  "On en reparle dans un milliard d'années.",
];
