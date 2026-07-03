// /parier — pile ou face contre le Caillou. Gain ×2, mais la maison a un léger
// avantage (48 % de victoire) : le Caillou n'est pas une œuvre de charité.
// Garde-fous : mise plafonnée + plafond de pertes nettes par jour UTC
// (pari + duel confondus), calculé depuis le journal `transactions`.
const WIN_CHANCE = 0.48;

export default new GlyriaCommand()
  .setName("parier")
  .setDescription("Jouer ta poussière à pile ou face. Le vide encaisse les perdants.")
  .addStringOption((o) =>
    o.setName("choix").setDescription("« pile » ou « face ».").setRequired(true),
  )
  .addIntegerOption((o) =>
    o.setName("montant").setDescription("Ta mise.").setRequired(true),
  )
  .execute(async (ctx) => {
    try {
      const { bet } = useConfig();
      const choice = ctx.options.getString("choix", true).trim().toLowerCase();
      const amount = ctx.options.getInteger("montant", true);

      if (choice !== "pile" && choice !== "face") {
        throw new CaillouError(pickPhrase("parier_bad_choice"));
      }
      if (!Number.isInteger(amount) || amount <= 0) {
        throw new CaillouError("Une mise positive. Le concept ne devrait pas t'échapper.");
      }
      if (amount > bet.maxStake) {
        throw new CaillouError(
          `Mise plafonnée à ${formatStardust(bet.maxStake)}. Le Caillou protège les joueurs, surtout de leur propre génie.`,
        );
      }

      const net = await useEconomy().netBetToday(ctx.user.id);
      if (net - amount < -bet.dailyLossCap) {
        throw new CaillouError(pickPhrase("parier_cap"));
      }

      const win = Math.random() < WIN_CHANCE;
      // La pièce affichée découle du résultat (l'avantage de la maison est
      // dans WIN_CHANCE, pas dans un deuxième tirage).
      const coin = win ? choice : choice === "pile" ? "face" : "pile";

      // Débit et éventuel crédit dans UNE transaction : pas d'état intermédiaire.
      const balance = await useDb().withTransaction(async (client) => {
        let b = await useEconomy().debit(client, ctx.user.id, amount, "pari:mise");
        if (win) {
          b = await useEconomy().credit(client, ctx.user.id, amount * 2, "pari:gain");
        }
        return b;
      });

      const comment = win
        ? pickPhrase("parier_win", { name: ctx.user.username, gain: amount, balance })
        : pickPhrase("parier_lose", { name: ctx.user.username, amount, balance });

      const embed = new EmbedV2Builder()
        .container({ accentColor: win ? 0x34d399 : 0xf87171 })
        .textDisplay(`# 🪙 ${coin.toUpperCase()} — ${win ? "gagné !" : "perdu."}`)
        .textDisplay(comment)
        .separator({ spacing: "large" })
        .textDisplay(`Solde : **${formatStardust(balance)}**`)
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
