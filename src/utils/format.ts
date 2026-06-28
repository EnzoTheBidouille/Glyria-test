// Petites fonctions pures de formatage. Auto-importées globalement.

/** "1 poussière d'étoile" / "42 poussières d'étoile". */
export const formatStardust = (amount: number): string =>
  `${amount} poussière${Math.abs(amount) > 1 ? "s" : ""} d'étoile`;

/** Médaille de podium, ou le rang en clair. */
export const rankBadge = (rank: number): string =>
  rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;

/** Horodatage Discord relatif (ex. "dans 3 jours"), ou "—" si pas d'expiration. */
export const discordRelative = (date: Date | null): string =>
  date ? `<t:${Math.floor(date.getTime() / 1000)}:R>` : "—";
