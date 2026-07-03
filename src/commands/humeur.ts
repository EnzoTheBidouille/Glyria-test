// /humeur — l'état d'âme quotidien du Caillou et son effet sur les gains.
// Même humeur pour tout le monde, toute la journée (UTC) : voir useMood.
export default new GlyriaCommand()
  .setName("humeur")
  .setDescription("L'humeur du Caillou aujourd'hui, et ce que ça coûte (ou rapporte).")
  .execute(async (ctx) => {
    try {
      const mood = useMood().current();
      const meteor = useEvents().earnMultiplier();
      const effect =
        mood.multiplier === 1
          ? "Gains passifs normaux."
          : `Gains passifs ×${mood.multiplier}.`;
      const meteorLine =
        meteor > 1 ? "\n🌠 **Pluie de météorites en cours : gains doublés !**" : "";

      const embed = new EmbedV2Builder()
        .container({ accentColor: 0x8b5cf6 })
        .textDisplay(`# ${mood.emoji} ${mood.label}`)
        .textDisplay(mood.description)
        .separator({ spacing: "large" })
        .textDisplay(`${effect}${meteorLine}`)
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
