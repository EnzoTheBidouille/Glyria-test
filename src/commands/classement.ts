// /classement — top 10 des amasseurs de poussière.
export default new GlyriaCommand()
  .setName("classement")
  .setDescription("Le top 10 des esclaves de la poussière d'étoile.")
  .execute(async (ctx) => {
    try {
      const top = await useEconomy().leaderboard(10);

      const container = new EmbedV2Builder().container({ accentColor: 0xfbbf24 });
      container.textDisplay("# 🏆 Le panthéon poussiéreux");

      if (top.length === 0) {
        container.textDisplay(pickPhrase("leaderboard_empty"));
      } else {
        container.textDisplay(pickPhrase("leaderboard_intro"));
        container.separator({ spacing: "large" });
        const lines = top
          .map(
            (entry, i) =>
              `${rankBadge(i + 1)} <@${entry.discordId}> — **${formatStardust(entry.balance)}**`,
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
