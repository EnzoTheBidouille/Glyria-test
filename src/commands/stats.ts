// /stats — la macro-économie du serveur vue par le Caillou : masse totale,
// plus riche, meilleur gagneur de la semaine, poussière détruite par la taxe.
export default new GlyriaCommand()
  .setName("stats")
  .setDescription("L'état de l'économie cosmique du serveur.")
  .execute(async (ctx) => {
    try {
      const s = await useEconomy().stats();

      const lines = [
        `💰 Masse totale : **${formatStardust(s.totalDust)}**`,
        `👥 Détenteurs de comptes : **${s.userCount}**`,
        `🧾 Transactions journalisées : **${s.transactionCount}**`,
        s.richest
          ? `🐉 Plus gros tas : <@${s.richest.discordId}> — **${formatStardust(s.richest.balance)}**`
          : "🐉 Plus gros tas : personne. Zéro dragon, que des lézards.",
        s.weeklyTop
          ? `⛏️ Meilleur gagneur (7 jours) : <@${s.weeklyTop.discordId}> — **+${formatStardust(s.weeklyTop.balance)}**`
          : "⛏️ Meilleur gagneur (7 jours) : personne n'a rien gagné. Fascinant.",
        `🕳️ Détruit par la taxe cosmique : **${formatStardust(s.destroyedByTax)}**`,
      ];

      const embed = new EmbedV2Builder()
        .container({ accentColor: 0x38bdf8 })
        .textDisplay("# 📊 L'économie du Caillou")
        .textDisplay(pickPhrase("stats_intro"))
        .separator({ spacing: "large" })
        .textDisplay(lines.join("\n"))
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
