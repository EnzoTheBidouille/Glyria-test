// Configuration globale du Caillou Magique.
// `defineGlyriaConfig` est injecté globalement par glyria.js — aucun import requis.
export default defineGlyriaConfig({
  dev: {
    // utils/ et composables/ sont chargés une fois au boot : un changement => redémarrage propre.
    // On y ajoute db/ et data/ car les composables en dépendent.
    restartPaths: ["composables", "utils", "db", "data"],
    autoImportDirs: ["utils", "composables"],
  },
  theme: {
    embedV2: {
      // Palette cosmique du Caillou.
      primaryColor: "#8B5CF6", // violet nébuleuse
      secondaryColor: "#64748B", // gris roche
      successColor: "#34D399", // vert poussière d'étoile
      errorColor: "#F87171", // rouge supernova
      warningColor: "#FBBF24", // jaune comète
      infoColor: "#38BDF8", // bleu cosmos
      footer: {
        text: "Le Caillou Magique • poussière d'étoile",
      },
    },
  },
});
