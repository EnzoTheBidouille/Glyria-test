// MessageCreate : gain passif de poussière, plafonné par cooldown (anti-spam),
// silencieux par design — sauf rare interjection méprisante du Caillou,
// doublement bridée (probabilité INTERJECTION_PERCENT + cooldown par salon).
import type { Message } from "discord.js";

// Dernière pique par salon (mémoire process : un redémarrage remet à zéro,
// sans conséquence — au pire le Caillou parle une fois de trop).
const lastInterjection = new Map<string, number>();

function maybeInterject(message: Message): void {
  const { chance, cooldownMs } = useConfig().interjection;
  if (chance <= 0) return;
  if (Math.random() >= chance) return;

  const last = lastInterjection.get(message.channelId) ?? 0;
  if (Date.now() - last < cooldownMs) return;
  lastInterjection.set(message.channelId, Date.now());

  void message
    .reply({
      content: pickPhrase("interjection", { name: message.author.username }),
      allowedMentions: { repliedUser: false },
    })
    .catch((err: Error) => logger.warn("Caillou", `Interjection échouée : ${err.message}`));
}

export default new GlyriaEvent()
  .setEvent(djs.Events.MessageCreate)
  .setHandler(async (message: Message) => {
    if (message.author.bot) return;
    if (!message.inGuild()) return;

    maybeInterject(message);

    try {
      await useEconomy().earn(message.author.id);
    } catch (err) {
      logger.error("Earn", `Gain passif échoué : ${(err as Error).message}`);
    }
  });
