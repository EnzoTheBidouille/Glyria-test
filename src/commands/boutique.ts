// /boutique — catalogue des perks et leur coût.
export default new GlyriaCommand()
  .setName("boutique")
  .setDescription("Voir ce que tu peux gaspiller ta poussière à acheter.")
  .execute(async (ctx) => {
    try {
      const items = await useShop().list();

      const container = new EmbedV2Builder().container({ accentColor: 0x38bdf8 });
      container.textDisplay("# 🛒 La boutique du Caillou");

      if (items.length === 0) {
        container.textDisplay(pickPhrase("boutique_empty"));
      } else {
        container.textDisplay(pickPhrase("boutique_intro"));
        for (const item of items) {
          container.separator({ spacing: "small" });
          container.textDisplay(
            `**${item.name}** — ${formatStardust(item.cost)}\n${item.config.description}`,
          );
        }
        container.separator({ spacing: "large" });
        container.textDisplay(
          "Pour acheter : `/acheter couleur` · `/acheter elu` · `/acheter renommer` · `/acheter statut` · `/acheter maudire` · `/acheter bouclier`",
        );
      }

      const embed = container.end().build();
      await ctx.reply({ ...embed });
    } catch (err) {
      await respondError(
        ctx,
        err instanceof CaillouError ? err.userMessage : pickPhrase("error_generic"),
      );
    }
  });
