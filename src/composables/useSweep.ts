// Balayage périodique : annule et supprime les perks arrivés à expiration.
// Un simple setInterval suffit pour des échéances en heures/jours, sans
// dépendance supplémentaire. Démarré au ClientReady. Auto-importé (`useSweep`).
const DEFAULT_INTERVAL_MS = 60_000;

let timer: NodeJS.Timeout | undefined;
let running = false;

async function sweepOnce(): Promise<void> {
  if (running) return; // pas de chevauchement
  running = true;
  try {
    const due = await useShop().dueActivePerks();
    for (const perk of due) {
      await usePerks().revert(perk); // best-effort, ne jette pas
      await useShop().deletePerk(perk.id);
    }
    if (due.length > 0) {
      logger.info("Sweep", `${due.length} perk(s) expiré(s) nettoyé(s).`);
    }
  } catch (err) {
    logger.error("Sweep", `Balayage échoué : ${(err as Error).message}`);
  } finally {
    running = false;
  }

  // Le tick fait aussi vivre les événements cosmiques et les saisons ; chacun
  // gère ses propres erreurs pour ne jamais bloquer l'expiration des perks.
  await useEvents().tick();
  await useSeasons()
    .tick()
    .catch((err: Error) => logger.error("Seasons", `Tick saison échoué : ${err.message}`));
}

export interface Sweep {
  start(intervalMs?: number): void;
  stop(): void;
  runOnce(): Promise<void>;
}

export const useSweep = (): Sweep => ({
  start(intervalMs = DEFAULT_INTERVAL_MS) {
    if (timer) return;
    void sweepOnce(); // un passage immédiat au démarrage
    timer = setInterval(() => void sweepOnce(), intervalMs);
    timer.unref?.();
    logger.info("Sweep", `Expiration des perks vérifiée toutes les ${Math.round(intervalMs / 1000)}s.`);
  },
  stop() {
    if (timer) {
      clearInterval(timer);
      timer = undefined;
    }
  },
  runOnce: sweepOnce,
});
