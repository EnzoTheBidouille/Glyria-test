// /roast — demander au Caillou d'incinérer un membre (ou soi-même, par défaut).
// Réponse publique : un roast sans témoins ne compte pas. Une fois sur trois,
// le roast est aromatisé au solde de la victime (contexte walletTier).
export default new GlyriaCommand()
  .setName("roast")
  .setDescription("Demander au Caillou d'incinérer quelqu'un. Gratuit et mérité.")
  .addUserOption((o) =>
    o
      .setName("cible")
      .setDescription("La victime. Sans cible : toi-même, évidemment.")
      .setRequired(false),
  )
  .execute(async (ctx) => {
    try {
      const target = ctx.options.getUser("cible") ?? ctx.user;

      if (target.id === ctx.client.user.id) {
        await ctx.reply({
          content: pickPhrase("roast_caillou", { name: ctx.user.username }),
        });
        return;
      }
      if (target.bot) {
        await ctx.reply({ content: pickPhrase("roast_bot", { name: ctx.user.username }) });
        return;
      }

      const balance = await useEconomy().balanceOf(target.id);
      const context = Math.random() < 1 / 3 ? walletTier(balance) : "generic";
      const text =
        (await useRoast()?.generate({
          context,
          userId: target.id,
          vars: { name: target.username, balance },
        })) ?? pickPhrase("error_generic");

      const embed = new EmbedV2Builder()
        .container({ accentColor: 0xf87171 })
        .textDisplay("# 🔥 Roast cosmique")
        .textDisplay(`<@${target.id}> — ${text}`)
        .end()
        .build();

      await ctx.reply({ ...embed, allowedMentions: { parse: [] } });
    } catch (err) {
      await respondError(
        ctx,
        err instanceof CaillouError ? err.userMessage : pickPhrase("error_generic"),
      );
    }
  });
