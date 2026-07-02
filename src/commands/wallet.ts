// /wallet — affiche ton solde avec un commentaire bien senti du Caillou.
export default new GlyriaCommand()
  .setName("wallet")
  .setDescription("Consulter ton misérable tas de poussière d'étoile.")
  .execute(async (ctx) => {
    try {
      const balance = await useEconomy().balanceOf(ctx.user.id);
      const tier = walletTier(balance);
      const vars = { name: ctx.user.username, balance };
      // Une fois sur deux : roast généré (Tier 2), sinon phrase curatée (Tier 1).
      const roast = useRoast();
      const comment =
        roast && Math.random() < 0.5
          ? await roast.generate({ context: tier, userId: ctx.user.id, vars })
          : pickPhrase(tier, vars);

      const embed = new EmbedV2Builder()
        .container({ accentColor: 0x8b5cf6 })
        .textDisplay(`# 🪙 ${formatStardust(balance)}`)
        .textDisplay(comment)
        .end()
        .build();

      await ctx.reply({ ...embed, flags: embed.flags | djs.MessageFlags.Ephemeral });
    } catch (err) {
      await respondError(
        ctx,
        err instanceof CaillouError ? err.userMessage : pickPhrase("error_generic"),
      );
    }
  });
