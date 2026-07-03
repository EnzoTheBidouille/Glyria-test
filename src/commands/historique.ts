// /historique — tes 10 dernières écritures au journal `transactions`, en
// éphémère. Les raisons techniques sont traduites en libellés lisibles.
import type { TransactionEntry } from "../types.js";

function labelFor(reason: string): string {
  if (reason === "earn") return "labeur passif";
  if (reason === "offrande") return "offrande quotidienne";
  if (reason === "taxe_cosmique") return "taxe cosmique 💸";
  if (reason === "pari:mise") return "pari (mise)";
  if (reason === "pari:gain") return "pari (gain)";
  if (reason.startsWith("duel:mise")) return "duel (mise)";
  if (reason.startsWith("duel:gain")) return "duel (gain)";
  if (reason.startsWith("give:out:")) return `don à <@${reason.slice("give:out:".length)}>`;
  if (reason.startsWith("give:in:")) return `don de <@${reason.slice("give:in:".length)}>`;
  if (reason.startsWith("buy:")) return `achat « ${reason.slice(4).replace(":extend", "")} »`;
  if (reason.startsWith("refund:")) return `remboursement « ${reason.slice(7)} »`;
  if (reason.startsWith("admin:")) return `ajustement admin (${reason.slice(6)})`;
  return reason;
}

const formatLine = (t: TransactionEntry): string => {
  const sign = t.delta >= 0 ? "+" : "";
  return `\`${sign}${t.delta}\` — ${labelFor(t.reason)} · ${discordRelative(t.createdAt)}`;
};

export default new GlyriaCommand()
  .setName("historique")
  .setDescription("Tes dernières transactions. Le Caillou n'oublie rien.")
  .execute(async (ctx) => {
    try {
      const entries = await useEconomy().history(ctx.user.id, 10);

      const container = new EmbedV2Builder().container({ accentColor: 0x64748b });
      container.textDisplay("# 📜 Registre cosmique");

      if (entries.length === 0) {
        container.textDisplay(pickPhrase("historique_empty"));
      } else {
        container.textDisplay(pickPhrase("historique_intro", { name: ctx.user.username }));
        container.separator({ spacing: "large" });
        container.textDisplay(entries.map(formatLine).join("\n"));
      }

      const embed = container.end().build();
      await ctx.reply({
        ...embed,
        flags: embed.flags | djs.MessageFlags.Ephemeral,
        allowedMentions: { parse: [] },
      });
    } catch (err) {
      await respondError(
        ctx,
        err instanceof CaillouError ? err.userMessage : pickPhrase("error_generic"),
      );
    }
  });
