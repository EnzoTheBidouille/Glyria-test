// Petit registre du client Discord, renseigné une fois au `ClientReady`, pour
// que les composables (perks, sweep) puissent agir sur Discord sans dépendre
// d'un global non documenté. Auto-importé (`useClient`, `setClient`).
import type { Client } from "discord.js";

let current: Client | undefined;

export const setClient = (client: Client): void => {
  current = client;
};

export const useClient = (): Client => {
  if (!current) {
    throw new Error("Client Discord non initialisé (ClientReady pas encore émis).");
  }
  return current;
};
