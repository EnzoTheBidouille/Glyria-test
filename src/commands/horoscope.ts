// /horoscope — la prédiction cosmique du jour. Déterministe par (membre, jour
// UTC) : relancer la commande ne change rien, les astres ont parlé. Le signe
// minéral, lui, est attribué à vie (hash de l'ID Discord).
import { ADVICE, PREDICTIONS, SIGNS } from "../data/horoscopes.js";

export default new GlyriaCommand()
  .setName("horoscope")
  .setDescription("Ta prédiction cosmique du jour. Les astres sont cruels mais honnêtes.")
  .execute(async (ctx) => {
    try {
      const day = utcDayKey();
      const sign = SIGNS[hashString(`signe:${ctx.user.id}`) % SIGNS.length]!;
      const prediction =
        PREDICTIONS[hashString(`prediction:${ctx.user.id}:${day}`) % PREDICTIONS.length]!;
      const advice = ADVICE[hashString(`conseil:${ctx.user.id}:${day}`) % ADVICE.length]!;

      const embed = new EmbedV2Builder()
        .container({ accentColor: 0x8b5cf6 })
        .textDisplay(`# ${sign.emoji} ${sign.name}`)
        .textDisplay(interpolate(prediction, { name: ctx.user.username }))
        .separator({ spacing: "large" })
        .textDisplay(`*${advice}*`)
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
