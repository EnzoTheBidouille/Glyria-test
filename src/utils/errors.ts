// Erreur "métier" porteuse d'un message déjà rédigé dans la voix du Caillou.
// Auto-importée globalement (`CaillouError`). Les commandes l'attrapent et
// affichent simplement `.userMessage` ; toute autre erreur => message générique.
export class CaillouError extends Error {
  constructor(public readonly userMessage: string) {
    super(userMessage);
    this.name = "CaillouError";
  }
}
