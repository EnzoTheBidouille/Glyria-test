// Événements cosmiques aléatoires, cadencés par le tick du sweep (~1/minute) :
//   - Pluie de météorites : gain passif ×2 pendant 10 minutes.
//   - Taxe cosmique : le plus riche perd 5-10 %, poussière détruite (puits).
// Le tout est DÉSACTIVÉ si EVENTS_CHANNEL_ID n'est pas configuré : un événement
// sans annonce publique n'a aucun intérêt. L'état météorites vit dans
// `app_state` pour survivre aux redémarrages. Auto-importé (`useEvents`).

const METEOR_STATE_KEY = "meteor";
const METEOR_DURATION_MS = 10 * 60_000;
/** Probabilité de déclenchement par tick (~1/min) : en moyenne toutes les ~6 h. */
const METEOR_CHANCE_PER_TICK = 1 / 360;
/** En moyenne une fois par jour. */
const TAX_CHANCE_PER_TICK = 1 / 1440;
/** En dessous de ce solde, même le fisc cosmique a pitié. */
const TAX_MIN_BALANCE = 1000;

interface MeteorState {
  /** Fin de la pluie en cours (epoch ms), ou null. */
  until: number | null;
}

// Miroir mémoire de l'état météorites : lu par earnMultiplier() à CHAQUE
// message, donc pas de requête DB sur ce chemin. Synchronisé par tick().
let meteorUntil: number | null = null;
let stateLoaded = false;

async function announce(text: string): Promise<void> {
  const channelId = useConfig().eventsChannelId;
  if (!channelId) return;
  const channel = await useClient().channels.fetch(channelId);
  if (channel && channel.isSendable()) {
    await channel.send(text);
  }
}

async function persistMeteor(until: number | null): Promise<void> {
  meteorUntil = until;
  await useAppState().set(METEOR_STATE_KEY, { until } satisfies MeteorState);
}

async function tickMeteor(): Promise<void> {
  if (!stateLoaded) {
    const saved = await useAppState().get<MeteorState>(METEOR_STATE_KEY);
    meteorUntil = saved?.until ?? null;
    stateLoaded = true;
  }

  const now = Date.now();
  if (meteorUntil !== null) {
    if (now >= meteorUntil) {
      await persistMeteor(null);
      await announce(pickPhrase("meteor_end"));
    }
    return;
  }

  if (Math.random() < METEOR_CHANCE_PER_TICK) {
    await persistMeteor(now + METEOR_DURATION_MS);
    await announce(pickPhrase("meteor_start"));
    logger.info("Events", "Pluie de météorites déclenchée (10 min, gains ×2).");
  }
}

async function tickTax(): Promise<void> {
  if (Math.random() >= TAX_CHANCE_PER_TICK) return;

  const [richest] = await useEconomy().leaderboard(1);
  if (!richest || richest.balance < TAX_MIN_BALANCE) return;

  const rate = 0.05 + Math.random() * 0.05; // 5 à 10 %
  const amount = Math.floor(richest.balance * rate);
  if (amount <= 0) return;

  await useDb().withTransaction(async (client) => {
    await useEconomy().debit(client, richest.discordId, amount, "taxe_cosmique");
  });
  await announce(
    pickPhrase("taxe_announce", { target: `<@${richest.discordId}>`, amount }),
  );
  logger.info("Events", `Taxe cosmique : ${amount} poussières prélevées sur ${richest.discordId}.`);
}

export interface Events {
  /** Multiplicateur de gain passif induit par les événements en cours. */
  earnMultiplier(): number;
  /** Appelé par le sweep (~1/minute) : fait vivre météorites et taxe. */
  tick(): Promise<void>;
}

export const useEvents = (): Events => ({
  earnMultiplier() {
    return meteorUntil !== null && Date.now() < meteorUntil ? 2 : 1;
  },

  async tick() {
    if (!useConfig().eventsChannelId) return;
    try {
      await tickMeteor();
    } catch (err) {
      logger.error("Events", `Tick météorites échoué : ${(err as Error).message}`);
    }
    try {
      await tickTax();
    } catch (err) {
      logger.error("Events", `Tick taxe échoué : ${(err as Error).message}`);
    }
  },
});
