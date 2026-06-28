// Réponse d'erreur uniforme : éphémère, préfixée ❌, gère l'état déféré/répondu.
// Auto-importé globalement (`respondError`). Texte simple (pas de Components V2)
// pour rester compatible avec un deferReply non-v2.
import type { RepliableInteraction } from "discord.js";

export const respondError = async (
  interaction: RepliableInteraction,
  message: string,
): Promise<void> => {
  const content = `❌ ${message}`;
  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content });
    } else {
      await interaction.reply({ content, flags: djs.MessageFlags.Ephemeral });
    }
  } catch (err) {
    logger.error("Reply", `Réponse d'erreur impossible : ${(err as Error).message}`);
  }
};
