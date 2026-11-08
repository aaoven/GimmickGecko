import { createServerFn } from "@tanstack/react-start";
import { generateHints } from "./hints.server";
import { hintInputSchema } from "./hints-schema";

export const getHints = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => hintInputSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      if (data.problemId) {
        const { publicDatabase } = await import("./public-db.server");
        const { data: bank, error } = await publicDatabase()
          .from("problems")
          .select("statement,answer")
          .eq("id", data.problemId)
          .single();
        if (error || !bank)
          return {
            ok: false as const,
            error: "That bank problem could not be found. Reopen it from the problem bank.",
          };
        return {
          ok: true as const,
          result: await generateHints({ problem: bank.statement, knownAnswer: bank.answer }),
        };
      }
      return { ok: true as const, result: await generateHints(data) };
    } catch (e) {
      console.error("hint generation failed", e);
      const status = (e as { statusCode?: number })?.statusCode;
      const message =
        status === 429
          ? "Gecko is busy — too many requests. Try again in a moment."
          : status === 402
            ? "AI credits ran out. Add credits in Settings → Plans & credits."
            : "Gecko couldn't read that problem. Try again.";
      return { ok: false as const, error: message };
    }
  });
