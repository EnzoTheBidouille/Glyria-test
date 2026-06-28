// /acheter — achat d'un perk. Un sous-commande par perk (glyria n'expose ni
// choices ni option "salon", d'où le découpage en sous-commandes et l'ID de
// salon passé en texte). Réponse éphémère en texte simple (deferReply non-v2,
// car le renommage de salon peut être lent / rate-limité par Discord).
import type { ChatInputCommandInteraction } from "discord.js";

async function buy(
  ctx: ChatInputCommandInteraction,
  itemId: string,
  value: string | undefined,
  channelId: string | undefined,
): Promise<void> {
  await ctx.deferReply({ flags: djs.MessageFlags.Ephemeral });
  try {
    const result = await useShop().purchase({
      userId: ctx.user.id,
      itemId,
      value,
      channelId,
    });
    const line = pickPhrase("buy_ok", { item: result.item.name, cost: result.cost });
    const expiry = result.expiresAt ? ` — expire ${discordRelative(result.expiresAt)}` : "";
    await ctx.editReply({ content: `✨ ${line}${expiry}` });
  } catch (err) {
    await respondError(
      ctx,
      err instanceof CaillouError ? err.userMessage : pickPhrase("error_generic"),
    );
  }
}

export default new GlyriaCommand()
  .setName("acheter")
  .setDescription("Acheter un perk à la boutique du Caillou.")
  .addSubCommand((c) =>
    c
      .setName("couleur")
      .setDescription("Un rôle de couleur rien qu'à toi, 7 jours.")
      .execute((ctx) => buy(ctx, "color_role", undefined, undefined)),
  )
  .addSubCommand((c) =>
    c
      .setName("elu")
      .setDescription("Te sacrer L'Élu du Caillou (détrône l'actuel).")
      .execute((ctx) => buy(ctx, "prestige_role", undefined, undefined)),
  )
  .addSubCommand((c) =>
    c
      .setName("renommer")
      .setDescription("Renommer un salon autorisé, 1 heure.")
      .addStringOption((o) =>
        o.setName("nom").setDescription("Le nouveau nom du salon.").setRequired(true),
      )
      .addStringOption((o) =>
        o
          .setName("salon")
          .setDescription("ID du salon (sinon le premier salon autorisé).")
          .setRequired(false),
      )
      .execute((ctx) => {
        const nom = ctx.options.getString("nom", true);
        const salon = ctx.options.getString("salon") ?? useConfig().renameWhitelist[0];
        return buy(ctx, "channel_rename", nom, salon);
      }),
  )
  .addSubCommand((c) =>
    c
      .setName("statut")
      .setDescription("Imposer une ligne de statut au Caillou, 1 heure.")
      .addStringOption((o) =>
        o
          .setName("texte")
          .setDescription("Ce que le Caillou prétendra faire.")
          .setRequired(true),
      )
      .execute((ctx) => {
        const texte = ctx.options.getString("texte", true);
        return buy(ctx, "bot_status", texte, undefined);
      }),
  );
