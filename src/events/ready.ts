// ClientReady : enregistre le client, applique le statut par défaut et démarre
// le balayage d'expiration des perks.
import type { Client } from "discord.js";

export default new GlyriaEvent()
  .setEvent(djs.Events.ClientReady)
  .once()
  .setHandler((client: Client<true>) => {
    setClient(client);
    usePerks().resetStatus();
    useSweep().start();
    logger.success("Caillou", `En ligne : ${client.user.tag} rumine désormais dans le vide.`);
  });
