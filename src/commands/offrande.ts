// /offrande — l'aumône quotidienne du Caillou, avec série (streak) : revenir
// chaque jour (UTC) fait grossir l'offrande jusqu'au plafond configuré.
export default new GlyriaCommand()
  .setName("offrande")
  .setDescription("Réclamer l'aumône quotidienne du Caillou. Une fois par jour, pas plus.")
  .execute(async (ctx) => {
    try {
      const { amount, streak, balance } = await useEconomy().claimDaily(ctx.user.id);
      const context = streak >= 2 ? "offrande_streak" : "offrande_ok";
      const comment = pickPhrase(context, {
        name: ctx.user.username,
        amount,
        streak,
        balance,
      });

      const embed = new EmbedV2Builder()
        .container({ accentColor: 0xfbbf24 })
        .textDisplay(`# 🙏 +${formatStardust(amount)}`)
        .textDisplay(comment)
        .separator({ spacing: "large" })
        .textDisplay(`Série : **${streak} jour${streak > 1 ? "s" : ""}** · Solde : **${formatStardust(balance)}**`)
        .end()
        .build();

      await ctx.reply({ ...embed });
    } catch (err) {
      await respondError(
        ctx,
        err instanceof CaillouError ? err.userMessage : pickPhrase("error_generic"),
      );
    }
  });
