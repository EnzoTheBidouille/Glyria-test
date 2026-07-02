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
