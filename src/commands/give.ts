// /give — transférer de la poussière à un autre membre.
export default new GlyriaCommand()
  .setName("give")
  .setDescription("Offrir de la poussière d'étoile à un autre caillou.")
  .addUserOption((o) =>
    o.setName("destinataire").setDescription("L'heureux élu.").setRequired(true),
  )
  .addIntegerOption((o) =>
    o.setName("montant").setDescription("Combien de poussières ?").setRequired(true),
  )
  .execute(async (ctx) => {
    try {
      const target = ctx.options.getUser("destinataire", true);
      const amount = ctx.options.getInteger("montant", true);

      if (target.bot) {
        throw new CaillouError(
          "Les bots n'ont que faire de ta poussière. Garde-la, ça t'évitera une humiliation.",
        );
      }

      const { balance } = await useEconomy().give(ctx.user.id, target.id, amount);

      const embed = new EmbedV2Builder()
        .container({ accentColor: 0x34d399 })
        .textDisplay("# ✨ Transfert cosmique")
        .textDisplay(
          pickPhrase("give_ok", {
            name: ctx.user.username,
            target: target.username,
            amount,
          }),
        )
        .separator({ spacing: "large" })
        .textDisplay(`Ton solde : **${formatStardust(balance)}**`)
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
