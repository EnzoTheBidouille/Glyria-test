// ClientReady : enregistre le client, applique le statut par défaut et démarre
// le balayage d'expiration des perks.
import type { Client } from "discord.js";

export default new GlyriaEvent()
  .setEvent(djs.Events.ClientReady)
  .once()
  .setHandler(async (client: Client<true>) => {
    setClient(client);
    // Restaure un éventuel statut acheté encore actif (sinon le défaut) : un
    // perk payé ne doit pas disparaître parce que le bot a redémarré.
    await usePerks().restoreStatus().catch((err: Error) => {
      logger.warn("Caillou", `Restauration du statut échouée : ${err.message}`);
    });
    useSweep().start();
    logger.success("Caillou", `En ligne : ${client.user.tag} rumine désormais dans le vide.`);
  });
