// CLI autonome : `npm run migrate`. Charge .env soi-même (hors runtime glyria)
// puis applique les migrations en attente.
import { runMigrations } from "./migrator.js";

try {
  // Node >= 20.12 : charge .env si présent. Sans échouer s'il n'existe pas
  // (ex. variables déjà injectées par l'orchestrateur).
  process.loadEnvFile?.();
} catch {
  // .env absent — on se fie aux variables d'environnement existantes.
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("❌ DATABASE_URL manquant. Renseignez-le dans .env.");
  process.exit(1);
}

try {
  const { applied, alreadyUpToDate } = await runMigrations(databaseUrl);
  if (alreadyUpToDate) {
    console.log("✔ Base déjà à jour, aucune migration à appliquer.");
  } else {
    console.log(`✔ Migrations appliquées : ${applied.join(", ")}`);
  }
  process.exit(0);
} catch (err) {
  console.error("❌ Migration échouée :", (err as Error).message);
  process.exit(1);
}
