// /caillou-admin — outils de modération de l'économie (réservé ManageGuild).
// Requis par le cahier des charges : perks "admin-reversible" + correction des
// exploits via le journal `transactions`.
export default new GlyriaCommand()
  .setName("caillou-admin")
  .setDescription("Outils d'administration de l'économie du Caillou.")
  .setPermissions(djs.PermissionsBitField.Flags.ManageGuild)
  .addSubCommand((c) =>
    c
      .setName("ajuster")
      .setDescription("Corriger le solde d'un membre (montant signé, audité).")
      .addUserOption((o) =>
        o.setName("membre").setDescription("Le membre.").setRequired(true),
      )
      .addIntegerOption((o) =>
        o
          .setName("montant")
          .setDescription("Variation (peut être négative).")
          .setRequired(true),
      )
      .addStringOption((o) =>
        o.setName("raison").setDescription("Pourquoi cet ajustement ?").setRequired(true),
      )
      .execute(async (ctx) => {
        await ctx.deferReply({ flags: djs.MessageFlags.Ephemeral });
        try {
          const membre = ctx.options.getUser("membre", true);
          const montant = ctx.options.getInteger("montant", true);
          const raison = ctx.options.getString("raison", true);
          const { balance } = await useEconomy().adjust(membre.id, montant, raison);
          await ctx.editReply({
            content: `✅ Solde de <@${membre.id}> ajusté de ${montant}. Nouveau solde : ${formatStardust(balance)}.`,
            allowedMentions: { parse: [] },
          });
        } catch (err) {
          await respondError(
            ctx,
            err instanceof CaillouError ? err.userMessage : pickPhrase("error_generic"),
          );
        }
      }),
  )
  .addSubCommand((c) =>
    c
      .setName("revoquer")
      .setDescription("Révoquer un perk actif par son ID (annule l'effet Discord).")
      .addIntegerOption((o) =>
        o.setName("id").setDescription("ID du perk (active_perks.id).").setRequired(true),
      )
      .execute(async (ctx) => {
        await ctx.deferReply({ flags: djs.MessageFlags.Ephemeral });
        try {
          const id = ctx.options.getInteger("id", true);
          const ok = await useShop().revokePerk(id);
          await ctx.editReply({
            content: ok
              ? `✅ Perk #${id} révoqué et annulé.`
              : `❓ Aucun perk actif portant l'ID #${id}.`,
          });
        } catch (err) {
          await respondError(
            ctx,
            err instanceof CaillouError ? err.userMessage : pickPhrase("error_generic"),
          );
        }
      }),
  )
  .addSubCommand((c) =>
    c
      .setName("solde")
      .setDescription("Consulter le solde d'un membre.")
      .addUserOption((o) =>
        o.setName("membre").setDescription("Le membre.").setRequired(true),
      )
      .execute(async (ctx) => {
        try {
          const membre = ctx.options.getUser("membre", true);
          const balance = await useEconomy().balanceOf(membre.id);
          await ctx.reply({
            content: `<@${membre.id}> possède ${formatStardust(balance)}.`,
            flags: djs.MessageFlags.Ephemeral,
            allowedMentions: { parse: [] },
          });
        } catch (err) {
          await respondError(
            ctx,
            err instanceof CaillouError ? err.userMessage : pickPhrase("error_generic"),
          );
        }
      }),
  );
