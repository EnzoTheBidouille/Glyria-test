// /classement — top 10 des amasseurs de poussière. Avec `semaine: true`, le
// classement porte sur la poussière GAGNÉE ces 7 derniers jours (hors
// transferts entrants et remboursements) au lieu du solde total.
export default new GlyriaCommand()
  .setName("classement")
  .setDescription("Le top 10 des esclaves de la poussière d'étoile.")
  .addBooleanOption((o) =>
    o
      .setName("semaine")
      .setDescription("Classement des gains des 7 derniers jours plutôt que des soldes.")
      .setRequired(false),
  )
  .execute(async (ctx) => {
    try {
      const weekly = ctx.options.getBoolean("semaine") ?? false;
      const top = weekly
        ? await useEconomy().earnedTop(new Date(Date.now() - 7 * 86_400_000), null, 10)
        : await useEconomy().leaderboard(10);

      const container = new EmbedV2Builder().container({ accentColor: 0xfbbf24 });
      container.textDisplay(
        weekly ? "# ⛏️ Les forçats de la semaine" : "# 🏆 Le panthéon poussiéreux",
      );

      if (top.length === 0) {
        container.textDisplay(
          pickPhrase(weekly ? "leaderboard_week_empty" : "leaderboard_empty"),
        );
      } else {
        container.textDisplay(
          pickPhrase(weekly ? "leaderboard_week_intro" : "leaderboard_intro"),
        );
        container.separator({ spacing: "large" });
        const lines = top
          .map(
            (entry, i) =>
              `${rankBadge(i + 1)} <@${entry.discordId}> — **${weekly ? "+" : ""}${formatStardust(entry.balance)}**`,
          )
          .join("\n");
        container.textDisplay(lines);
      }

      const embed = container.end().build();
      await ctx.reply({ ...embed, allowedMentions: { parse: [] } });
    } catch (err) {
      await respondError(
        ctx,
        err instanceof CaillouError ? err.userMessage : pickPhrase("error_generic"),
      );
    }
  });
