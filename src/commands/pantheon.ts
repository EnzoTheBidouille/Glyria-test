// /pantheon — le hall of fame des vainqueurs hebdomadaires (poussière gagnée
// sur la semaine ISO, couronnés par le tick des saisons).
export default new GlyriaCommand()
  .setName("pantheon")
  .setDescription("Les vainqueurs hebdomadaires, gravés dans la pierre. Littéralement.")
  .execute(async (ctx) => {
    try {
      const entries = await useSeasons().hallOfFame(10);

      const container = new EmbedV2Builder().container({ accentColor: 0xfbbf24 });
      container.textDisplay("# 🏛️ Le Panthéon du Caillou");

      if (entries.length === 0) {
        container.textDisplay(pickPhrase("pantheon_empty"));
      } else {
        container.textDisplay(pickPhrase("pantheon_intro"));
        container.separator({ spacing: "large" });
        container.textDisplay(
          entries
            .map(
              (e) =>
                `👑 **${e.season}** — <@${e.userId}> · +${formatStardust(e.earned)}`,
            )
            .join("\n"),
        );
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
