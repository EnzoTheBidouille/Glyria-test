// Point d'entrée. Dans l'entrypoint on importe explicitement (plutôt que de se
// fier aux globaux auto-importés) pour garantir l'ordre : valider la config →
// jouer les migrations → connecter le bot.
import { runMigrations } from "./db/migrator.js";

const config = useConfig();

const { applied, alreadyUpToDate } = await runMigrations(config.databaseUrl);
if (alreadyUpToDate) {
  logger.info("Database", "Schéma déjà à jour.");
} else {
  logger.success("Database", `Migrations appliquées : ${applied.join(", ")}`);
}

const client = new GlyriaClient({
  intents: [
    djs.GatewayIntentBits.Guilds,
    djs.GatewayIntentBits.GuildMessages,
    djs.GatewayIntentBits.GuildMembers,
  ],
});

await client.login();
