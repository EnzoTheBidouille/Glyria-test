// /duel — défier un membre : chacun mise, le hasard tranche, le gagnant rafle
// le pot. Consentement obligatoire : la cible accepte ou refuse via boutons
// (60 s). Les soldes ne bougent qu'à l'acceptation, dans UNE transaction, avec
// verrouillage des deux comptes en ordre déterministe (même schéma que /give).
import type { ButtonBuilder, ButtonInteraction } from "discord.js";

const ACCEPT_ID = "duel_accept";
const REFUSE_ID = "duel_refuse";
const TIMEOUT_MS = 60_000;

/** Débite les deux duellistes et crédite le vainqueur. Renvoie l'ID du vainqueur. */
async function settle(aId: string, bId: string, amount: number): Promise<string> {
  const winnerId = Math.random() < 0.5 ? aId : bId;
  const loserId = winnerId === aId ? bId : aId;
  await useDb().withTransaction(async (client) => {
    // Ordre déterministe pour éviter les interblocages entre duels croisés.
    // debit() verrouille chaque ligne et jette si un solde est insuffisant.
    const [first, second] = [aId, bId].sort();
    await useEconomy().debit(client, first!, amount, `duel:mise:${first === aId ? bId : aId}`);
    await useEconomy().debit(client, second!, amount, `duel:mise:${second === aId ? bId : aId}`);
    await useEconomy().credit(client, winnerId, amount * 2, `duel:gain:${loserId}`);
  });
  return winnerId;
}

export default new GlyriaCommand()
  .setName("duel")
  .setDescription("Défier un membre : mise contre mise, le vide désigne le vainqueur.")
  .addUserOption((o) =>
    o.setName("adversaire").setDescription("Ta future victime (ou ton futur bourreau).").setRequired(true),
  )
  .addIntegerOption((o) =>
    o.setName("montant").setDescription("La mise de chacun.").setRequired(true),
  )
  .execute(async (ctx) => {
    try {
      const { bet } = useConfig();
      const target = ctx.options.getUser("adversaire", true);
      const amount = ctx.options.getInteger("montant", true);

      if (target.bot) {
        throw new CaillouError("Les bots ne duellent pas. Ils gagneraient, et tu le sais.");
      }
      if (target.id === ctx.user.id) {
        throw new CaillouError("Te battre contre toi-même ? Tu perds déjà tous les jours, pas besoin de miser.");
      }
      if (!Number.isInteger(amount) || amount <= 0) {
        throw new CaillouError("Une mise positive, l'ami. On duelle avec de la poussière, pas des dettes.");
      }
      if (amount > bet.maxStake) {
        throw new CaillouError(`Mise plafonnée à ${formatStardust(bet.maxStake)}.`);
      }

      // Plafond de pertes du provocateur (celui de la cible est vérifié à l'acceptation).
      if ((await useEconomy().netBetToday(ctx.user.id)) - amount < -bet.dailyLossCap) {
        throw new CaillouError(pickPhrase("parier_cap"));
      }
      // Vérification molle des soldes pour échouer tôt ; la vraie garantie est
      // dans la transaction de règlement.
      if ((await useEconomy().balanceOf(ctx.user.id)) < amount) {
        throw new CaillouError(pickPhrase("give_broke", { amount }));
      }

      const row = new djs.ActionRowBuilder<ButtonBuilder>().addComponents(
        new djs.ButtonBuilder()
          .setCustomId(ACCEPT_ID)
          .setLabel("Accepter le duel")
          .setEmoji("⚔️")
          .setStyle(djs.ButtonStyle.Danger),
        new djs.ButtonBuilder()
          .setCustomId(REFUSE_ID)
          .setLabel("Refuser")
          .setStyle(djs.ButtonStyle.Secondary),
      );

      const response = await ctx.reply({
        content: `⚔️ ${pickPhrase("duel_challenge", {
          name: ctx.user.username,
          target: `<@${target.id}>`,
          amount,
        })}`,
        components: [row],
        allowedMentions: { users: [target.id] },
      });

      let click: ButtonInteraction;
      try {
        click = (await response.awaitMessageComponent({
          filter: (i) => i.user.id === target.id,
          componentType: djs.ComponentType.Button,
          time: TIMEOUT_MS,
        })) as ButtonInteraction;
      } catch {
        await ctx.editReply({
          content: `⌛ ${pickPhrase("duel_timeout", { target: target.username })}`,
          components: [],
        });
        return;
      }

      if (click.customId === REFUSE_ID) {
        await click.update({
          content: `🏳️ ${pickPhrase("duel_refuse", { target: target.username })}`,
          components: [],
        });
        return;
      }

      try {
        if ((await useEconomy().netBetToday(target.id)) - amount < -bet.dailyLossCap) {
          throw new CaillouError(pickPhrase("parier_cap"));
        }
        const winnerId = await settle(ctx.user.id, target.id, amount);
        const loserId = winnerId === ctx.user.id ? target.id : ctx.user.id;
        await click.update({
          content: `⚔️ ${pickPhrase("duel_win", {
            winner: `<@${winnerId}>`,
            loser: `<@${loserId}>`,
            pot: amount * 2,
          })}`,
          components: [],
          allowedMentions: { users: [winnerId, loserId] },
        });
      } catch (err) {
        await click.update({
          content: `❌ ${err instanceof CaillouError ? err.userMessage : pickPhrase("error_generic")}`,
          components: [],
        });
      }
    } catch (err) {
      await respondError(
        ctx,
        err instanceof CaillouError ? err.userMessage : pickPhrase("error_generic"),
      );
    }
  });
