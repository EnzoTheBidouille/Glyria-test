// MessageCreate : gain passif de poussière, plafonné par cooldown (anti-spam).
// Silencieux par design (pas de réponse) pour ne pas inonder le salon.
import type { Message } from "discord.js";

export default new GlyriaEvent()
  .setEvent(djs.Events.MessageCreate)
  .setHandler(async (message: Message) => {
    if (message.author.bot) return;
    if (!message.inGuild()) return;

    try {
      await useEconomy().earn(message.author.id);
    } catch (err) {
      logger.error("Earn", `Gain passif échoué : ${(err as Error).message}`);
    }
  });
