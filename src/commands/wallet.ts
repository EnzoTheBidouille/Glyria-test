// /wallet — affiche ton solde avec un commentaire bien senti du Caillou.
export default new GlyriaCommand()
  .setName("wallet")
  .setDescription("Consulter ton misérable tas de poussière d'étoile.")
  .execute(async (ctx) => {
    try {
      const balance = await useEconomy().balanceOf(ctx.user.id);
      const comment = pickPhrase(walletTier(balance), {
        name: ctx.user.username,
        balance,
      });

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
