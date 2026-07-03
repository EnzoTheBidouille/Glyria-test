// /acheter — achat d'un perk. Un sous-commande par perk (glyria n'expose ni
// choices ni option "salon", d'où le découpage en sous-commandes et le salon
// passé en texte libre, résolu ci-dessous). Réponse éphémère en texte simple
// (deferReply non-v2, car le renommage peut être lent / rate-limité par Discord).
import type { ChatInputCommandInteraction } from "discord.js";

/**
 * Résout l'option `salon` (texte libre) vers un ID de la whitelist : accepte
 * une mention `<#id>`, un ID brut, ou un nom de salon (avec ou sans `#`).
 * Sans entrée : le premier salon autorisé. Une entrée non résolue est renvoyée
 * telle quelle — le contrôle de whitelist de `purchase()` produira l'erreur.
 */
async function resolveChannelInput(raw: string | undefined): Promise<string | undefined> {
  const whitelist = useConfig().renameWhitelist;
  if (!raw || raw.trim() === "") return whitelist[0];
  const input = raw.trim();

  const mention = input.match(/^<#(\d{17,20})>$/);
  if (mention) return mention[1];
  if (/^\d{17,20}$/.test(input)) return input;

  const wanted = input.replace(/^#/, "").toLowerCase();
  for (const id of whitelist) {
    try {
      const channel = await useClient().channels.fetch(id);
      if (
        channel &&
        "name" in channel &&
        typeof channel.name === "string" &&
        channel.name.toLowerCase() === wanted
      ) {
        return id;
      }
    } catch {
      // Salon de la whitelist introuvable : on l'ignore, les autres restent candidats.
    }
  }
  return input;
}

async function buy(
  ctx: ChatInputCommandInteraction,
  itemId: string,
  value: string | undefined,
  channelInput: string | undefined,
  targetId?: string,
): Promise<void> {
  await ctx.deferReply({ flags: djs.MessageFlags.Ephemeral });
  try {
    const channelId =
      itemId === "channel_rename" ? await resolveChannelInput(channelInput) : undefined;
    const result = await useShop().purchase({
      userId: ctx.user.id,
      itemId,
      value,
      channelId,
      targetId,
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
          .setDescription("#mention, nom ou ID du salon (sinon le premier autorisé).")
          .setRequired(false),
      )
      .execute((ctx) => {
        const nom = ctx.options.getString("nom", true);
        return buy(ctx, "channel_rename", nom, ctx.options.getString("salon") ?? undefined);
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
  )
  .addSubCommand((c) =>
    c
      .setName("maudire")
      .setDescription("Rebaptiser un autre membre pendant 1 heure. Cruel et tarifé.")
      .addUserOption((o) =>
        o.setName("cible").setDescription("La victime de la malédiction.").setRequired(true),
      )
      .addStringOption((o) =>
        o
          .setName("pseudo")
          .setDescription("Le pseudo infligé (32 caractères max).")
          .setRequired(true),
      )
      .execute(async (ctx) => {
        const cible = ctx.options.getUser("cible", true);
        const pseudo = ctx.options.getString("pseudo", true);
        if (cible.bot) {
          await ctx.reply({
            content: "❌ On ne maudit pas un bot. Entre machines, on se respecte.",
            flags: djs.MessageFlags.Ephemeral,
          });
          return;
        }
        return buy(ctx, "nickname_curse", pseudo, undefined, cible.id);
      }),
  )
  .addSubCommand((c) =>
    c
      .setName("bouclier")
      .setDescription("24 h d'immunité contre /roast et les malédictions.")
      .execute((ctx) => buy(ctx, "roast_immunity", undefined, undefined)),
  );
