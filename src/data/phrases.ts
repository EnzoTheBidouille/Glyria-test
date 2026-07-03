// Banque de phrases pondérées (Tier 1) — voix du Caillou : sarcastique, blasé,
// cosmique, mesquin sur l'économie. Variables interpolées : {name}, {balance},
// {amount}, {target}, {item}, {cost}, {rank}.
//
// Aucune dépendance, aucun appel réseau. Le Tier 2 (roast via API) se branchera
// par-dessus sans toucher ce fichier (voir composables/useRoast.ts).
import type { Phrase } from "../types.js";

export const PHRASES = {
  // ── /wallet ────────────────────────────────────────────────────────────────
  wallet_zero: [
    { text: "Zéro poussière. Le néant intersidéral te va si bien, {name}.", weight: 3 },
    { text: "{name}, ton portefeuille est aussi vide que l'espace entre tes oreilles.", weight: 2 },
    { text: "0 poussière d'étoile. Même un trou noir a plus de contenu que toi.", weight: 1 },
  ],
  wallet_some: [
    { text: "{balance} poussières. Modeste. Comme toi, {name}.", weight: 3 },
    { text: "Tu pèses {balance} poussières d'étoile. Ne dépense pas tout d'un coup, génie.", weight: 2 },
    { text: "{balance} poussières. C'est mignon. Continue de ramper, {name}.", weight: 2 },
  ],
  wallet_rich: [
    { text: "{balance} poussières. Le Caillou daigne te trouver à peine pathétique, {name}.", weight: 3 },
    { text: "Une fortune de {balance} poussières. Ça ne t'achètera toujours pas de personnalité.", weight: 2 },
    { text: "{balance} poussières d'étoile. Impressionnant. Pour un être de carbone.", weight: 1 },
  ],

  // ── /give ────────────────────────────────────────────────────────────────
  give_ok: [
    { text: "{amount} poussières filent de {name} vers {target}. La générosité, cette maladie.", weight: 3 },
    { text: "Transfert de {amount} poussières effectué. {target} te remerciera peut-être. Probablement pas.", weight: 2 },
    { text: "{name} se déleste de {amount} poussières pour {target}. Touchant. Suivant.", weight: 2 },
  ],
  give_self: [
    { text: "Te donner à toi-même ? Même moi je ne suis pas aussi seul, {name}.", weight: 3 },
    { text: "Non. On ne se fait pas de virement à soi-même. Ce n'est pas une thérapie.", weight: 2 },
  ],
  give_broke: [
    { text: "Tu n'as pas {amount} poussières, {name}. On ne donne pas ce qu'on n'a pas. Concept dur, je sais.", weight: 3 },
    { text: "Refusé. Ton solde ne couvre même pas ton ambition. Triste.", weight: 2 },
  ],
  give_bad_amount: [
    { text: "Un montant positif, {name}. Les nombres négatifs, c'est pour les gens malhonnêtes et toi.", weight: 3 },
    { text: "Donne une vraie quantité. Au moins 1 poussière. C'est pas sorcier.", weight: 2 },
  ],

  // ── /boutique & /acheter ────────────────────────────────────────────────
  boutique_intro: [
    { text: "La boutique du Caillou. Achète de l'éphémère avec de l'éphémère.", weight: 3 },
    { text: "Voilà ce que tu peux gaspiller tes poussières à acheter. Choisis bien. Ou pas.", weight: 2 },
  ],
  boutique_empty: [
    { text: "La boutique est vide. Comme mes attentes envers toi.", weight: 1 },
  ],
  buy_ok: [
    { text: "Acheté : {item}. {cost} poussières pulvérisées. Profites-en, ça ne dure pas.", weight: 3 },
    { text: "{item} activé. {cost} poussières en moins. Le vide te remercie.", weight: 2 },
    { text: "Tu as troqué {cost} poussières contre {item}. Un investissement. Médiocre.", weight: 2 },
  ],
  buy_broke: [
    { text: "{item} coûte {cost} poussières. Tu ne les as pas. Reviens quand tu existeras vraiment.", weight: 3 },
    { text: "Pas assez de poussières pour {item}. Le rêve était beau pourtant.", weight: 2 },
  ],
  buy_unavailable: [
    { text: "Cet article n'existe pas ou n'est plus en vente. Comme ta crédibilité.", weight: 2 },
  ],
  buy_needs_value: [
    { text: "Ce perk exige une valeur (option `valeur`). Réfléchis avant de cliquer, {name}.", weight: 2 },
  ],
  buy_too_long: [
    { text: "Trop long. {max} caractères maximum. Le cosmos est infini, ce champ non.", weight: 3 },
    { text: "Raccourcis-moi ça : {max} caractères, pas un de plus. Discord a des limites. Toi aussi, visiblement.", weight: 2 },
  ],
  buy_needs_channel: [
    { text: "Choisis un salon (option `salon`) dans la liste autorisée. Je ne lis pas dans tes pensées vides.", weight: 2 },
  ],
  buy_bad_channel: [
    { text: "Ce salon n'est pas dans ma liste blanche. Je ne touche pas à n'importe quoi, contrairement à toi.", weight: 3 },
  ],
  buy_misconfigured: [
    { text: "Ce perk est mal configuré côté serveur. Va crier sur un admin, pas sur moi.", weight: 2 },
  ],

  // ── /classement ────────────────────────────────────────────────────────
  leaderboard_intro: [
    { text: "Le panthéon des amasseurs de poussière. Félicitations, vous avez tous une vie.", weight: 3 },
    { text: "Voici qui ramasse le plus de poussière. Quel accomplissement cosmique.", weight: 2 },
  ],
  leaderboard_empty: [
    { text: "Personne n'a la moindre poussière. Un désert. J'adore.", weight: 1 },
  ],

  // ── /roast ────────────────────────────────────────────────────────────────
  roast_caillou: [
    { text: "Me roast, MOI ? J'ai survécu à 4,5 milliards d'années de météorites, {name}. Toi, tu survis à peine au lundi.", weight: 3 },
    { text: "Audacieux. On ne roast pas un caillou : le feu, c'est mon élément d'origine, {name}.", weight: 2 },
    { text: "Non. Par contre, toi, reste dans le coin — j'allais justement chercher un exemple de médiocrité.", weight: 2 },
  ],
  roast_bot: [
    { text: "Je ne roast pas les bots. Entre machines, on garde une dignité que vous, les organiques, n'aurez jamais.", weight: 3 },
    { text: "Roast un bot ? Il exécute son code sans se plaindre, lui. C'est déjà mieux que toi, {name}.", weight: 2 },
  ],

  // ── /offrande ────────────────────────────────────────────────────────────
  offrande_ok: [
    { text: "Tiens, {amount} poussières. Ne me remercie pas, c'est de la pitié institutionnalisée.", weight: 3 },
    { text: "{amount} poussières d'étoile, prélevées sur ma grandeur. Dépense-les mal, comme d'habitude.", weight: 2 },
    { text: "L'offrande du jour : {amount} poussières. Même les astres font l'aumône, c'est dire.", weight: 2 },
  ],
  offrande_streak: [
    { text: "{amount} poussières. {streak} jours d'affilée à mendier — ta constance serait admirable si elle servait à autre chose.", weight: 3 },
    { text: "Jour {streak} de ta série. {amount} poussières. Tu reviens chaque jour, comme une érosion. Je respecte l'érosion.", weight: 2 },
  ],
  offrande_already: [
    { text: "Tu as DÉJÀ eu ton offrande aujourd'hui. La gourmandise, chez un être aussi peu méritant, c'est fascinant.", weight: 3 },
    { text: "Reviens demain. Le Caillou distribue une fois par jour, pas une fois par caprice.", weight: 2 },
    { text: "Non. Tu as déjà tendu la main aujourd'hui. Va faire semblant de travailler.", weight: 2 },
  ],

  // ── /parier ──────────────────────────────────────────────────────────────
  parier_win: [
    { text: "{gain} poussières pour toi. La chance des débutants, ou une erreur cosmique. Je penche pour l'erreur.", weight: 3 },
    { text: "Gagné. {gain} poussières. Savoure : statistiquement, la suite sera une leçon d'humilité.", weight: 2 },
    { text: "Tu empoches {gain} poussières. Même un caillou lancé au hasard retombe parfois du bon côté.", weight: 2 },
  ],
  parier_lose: [
    { text: "Perdu. {amount} poussières retournées au néant, comme tes ambitions.", weight: 3 },
    { text: "Le vide te remercie pour ces {amount} poussières. Lui au moins, il est content de te connaître.", weight: 2 },
    { text: "{amount} poussières envolées. Le hasard a bon goût, finalement.", weight: 2 },
  ],
  parier_cap: [
    { text: "Stop. Tu as assez perdu pour aujourd'hui. Même le Caillou a une conscience — surprenant, hein ?", weight: 3 },
    { text: "Plafond de pertes atteint. Reviens demain ruiner ta journée. Là, c'est fermé.", weight: 2 },
  ],
  parier_bad_choice: [
    { text: "C'est « pile » ou « face ». Deux options. Tu as trouvé le moyen d'en inventer une troisième. Bravo.", weight: 1 },
  ],

  // ── /duel ────────────────────────────────────────────────────────────────
  duel_challenge: [
    { text: "{name} jette {amount} poussières dans l'arène et défie {target}. Deux primates, un tas de poussière. Le spectacle habituel.", weight: 3 },
    { text: "{name} provoque {target} en duel cosmique : {amount} poussières en jeu. Le Caillou vend déjà des places.", weight: 2 },
  ],
  duel_win: [
    { text: "{winner} rafle {pot} poussières. {loser}, tu peux garder ta dignité. Ah non, pardon, elle était dans la mise.", weight: 3 },
    { text: "Le vide a tranché : {winner} empoche {pot} poussières. {loser} empoche l'expérience. Ça ne s'échange pas en boutique.", weight: 2 },
  ],
  duel_refuse: [
    { text: "{target} décline. La lâcheté est aussi une stratégie de survie, paraît-il.", weight: 2 },
    { text: "{target} refuse le duel. Sage. Rare, mais sage.", weight: 2 },
  ],
  duel_timeout: [
    { text: "{target} n'a pas répondu. Soit du mépris, soit une sieste. Dans les deux cas, duel annulé.", weight: 2 },
    { text: "Silence intersidéral de {target}. Le duel s'évapore, la mise reste au chaud.", weight: 2 },
  ],

  // ── /historique ──────────────────────────────────────────────────────────
  historique_intro: [
    { text: "Tes dernières manœuvres financières. Le Caillou garde TOUT. C'est ce qui rend la lecture si cruelle.", weight: 2 },
    { text: "Le registre de tes exploits économiques. Prépare-toi à un moment d'introspection.", weight: 2 },
  ],
  historique_empty: [
    { text: "Aucune transaction. Une existence économique aussi vide que l'espace interstellaire. Poétique.", weight: 1 },
  ],

  // ── /stats ───────────────────────────────────────────────────────────────
  stats_intro: [
    { text: "L'état de mon économie. Vous appelez ça la macro-économie, j'appelle ça compter des grains de poussière.", weight: 2 },
    { text: "Les chiffres du serveur. Chaque poussière compte. Chacun de vous, un peu moins.", weight: 2 },
  ],

  // ── Interjections spontanées ─────────────────────────────────────────────
  interjection: [
    { text: "Je lisais. Malheureusement.", weight: 3 },
    { text: "Fascinant. Continuez, je prends des notes pour mon rapport sur la décadence des organiques.", weight: 3 },
    { text: "4,5 milliards d'années d'existence, et c'est CE message que je dois lire.", weight: 3 },
    { text: "Le vide intersidéral est silencieux, lui. Je dis ça, je dis rien.", weight: 2 },
    { text: "Quelque part, une étoile s'est éteinte pendant que tu écrivais ça. Coïncidence ? Elle a préféré.", weight: 2 },
    { text: "Intéressant. Enfin, « intéressant » au sens géologique : dans dix mille ans, peut-être.", weight: 2 },
    { text: "Ne vous arrêtez pas pour moi. De toute façon, rien ne vous arrête, j'ai vérifié.", weight: 1 },
  ],

  // ── Événements cosmiques ─────────────────────────────────────────────────
  meteor_start: [
    { text: "🌠 **PLUIE DE MÉTÉORITES.** Mes cousines passent dire bonjour. Gains doublés pendant 10 minutes. Agitez-vous, petites choses.", weight: 2 },
    { text: "🌠 **Alerte : pluie de météorites.** Pendant 10 minutes, la poussière tombe double. Même le cosmos fait des soldes, c'est navrant.", weight: 2 },
  ],
  meteor_end: [
    { text: "La pluie de météorites est terminée. Retour à la médiocrité tarifaire habituelle.", weight: 2 },
    { text: "Fin du spectacle. Mes cousines sont reparties, déçues, comme tout le monde ici.", weight: 2 },
  ],
  taxe_announce: [
    { text: "💸 **TAXE COSMIQUE.** {target} était trop riche. Le Caillou a prélevé {amount} poussières et les a rendues au néant. La redistribution, version trou noir.", weight: 2 },
    { text: "💸 Le Caillou a taxé {target} de {amount} poussières. Motif : arrogance patrimoniale. Les poussières ont été désintégrées, par principe.", weight: 2 },
  ],
  season_crown: [
    { text: "👑 **Fin de semaine cosmique.** {target} a amassé {amount} poussières en sept jours et entre au Panthéon. Les autres : merci d'avoir participé, comme on dit aux médiocres.", weight: 2 },
    { text: "👑 La semaine s'achève. {target} couronné·e avec {amount} poussières engrangées. Le Panthéon s'agrandit, mes standards baissent.", weight: 2 },
  ],

  // ── /pantheon ────────────────────────────────────────────────────────────
  pantheon_intro: [
    { text: "Les élus hebdomadaires. Gravés dans la pierre — c'est moi, la pierre, et je n'ai pas signé pour ça.", weight: 2 },
  ],
  pantheon_empty: [
    { text: "Le Panthéon est vide. Aucune semaine achevée, ou aucun d'entre vous digne d'y figurer. Les deux hypothèses me vont.", weight: 1 },
  ],

  // ── Classement hebdomadaire ──────────────────────────────────────────────
  leaderboard_week_intro: [
    { text: "Les plus gros ramasseurs de poussière des sept derniers jours. L'ambition à l'échelle du gravier.", weight: 2 },
  ],
  leaderboard_week_empty: [
    { text: "Personne n'a rien gagné cette semaine. Une performance collective remarquable.", weight: 1 },
  ],

  // ── Perks offensifs ──────────────────────────────────────────────────────
  buy_needs_target: [
    { text: "Il me faut une cible. La méchanceté sans destinataire, c'est juste de la mauvaise humeur.", weight: 1 },
  ],
  curse_shielded: [
    { text: "Raté. {target} porte le Bouclier de basalte. Ta poussière reste, ta frustration aussi.", weight: 2 },
    { text: "{target} est sous bouclier. Même le Caillou respecte le basalte. Surtout le Caillou, en fait.", weight: 2 },
  ],
  roast_shielded: [
    { text: "{target} porte le Bouclier de basalte. Je ne roast pas à travers du basalte — question de respect entre minéraux. Toi par contre, {name}, tu es à découvert…", weight: 2 },
    { text: "Impossible : {target} a payé pour la paix. Toi, {name}, tu es gratuit. Réfléchis-y.", weight: 2 },
  ],

  // ── Divers ────────────────────────────────────────────────────────────────
  error_generic: [
    { text: "Quelque chose a explosé dans le vide. Ce n'est pas ma faute. Réessaie.", weight: 3 },
    { text: "Erreur cosmique. Le Caillou hausse les épaules. Recommence plus tard.", weight: 2 },
  ],
  admin_done: [
    { text: "C'est fait. Le Caillou a parlé.", weight: 1 },
  ],
} satisfies Record<string, Phrase[]>;

export type PhraseKey = keyof typeof PHRASES;
