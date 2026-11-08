import { createServerFn } from "@tanstack/react-start";
import { generateHints } from "./hints.server";
import { hintInputSchema } from "./hints-schema";

export const getHints = createServerFn({ method: "POST" })
  .validator((data: unknown) => hintInputSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const { retrieveMatchingProblem } = await import("./problem-match.server");
      const matched = data.problemId
        ? null
        : await retrieveMatchingProblem(data.problem, data.imageDataUrl);
      const problemId = data.problemId ?? matched?.id;
      if (problemId) {
        const { publicDatabase } = await import("./public-db.server");
        const { data: bank, error } = await publicDatabase()
          .from("problems")
          .select("statement,answer")
          .eq("id", problemId)
          .single();
        if (error || !bank)
          return {
            ok: false as const,
            error: "That bank problem could not be found. Reopen it from the problem bank.",
          };
        const { tutoringRecord } = await import("./tutoring.server");
        const { selectReferenceSolution } = await import("./tutoring");
        const source = await tutoringRecord(problemId);
        const referenceSolution = source ? selectReferenceSolution(source) : undefined;
        if (
          source?.visualRequired &&
          !source.visualContext &&
          !referenceSolution &&
          !data.imageDataUrl
        )
          return {
            ok: false as const,
            error:
              "This problem needs its diagram. Upload a clear image including the diagram so the gecko can read it accurately.",
          };
        return {
          ok: true as const,
          canCheckAnswer: bank.answer != null,
          grounding: referenceSolution
            ? ("source_solution" as const)
            : bank.answer != null
              ? ("bank_answer" as const)
              : ("generated" as const),
          match: matched
            ? {
                id: matched.id,
                label: `${matched.contest} ${matched.year} #${matched.problem_number}`,
              }
            : null,
          result: await generateHints({
            problem: [bank.statement, source?.visualContext].filter(Boolean).join("\n"),
            knownAnswer: bank.answer,
            imageDataUrl: data.imageDataUrl,
            ...(referenceSolution ? { referenceSolution } : {}),
          }),
        };
      }
      return {
        ok: true as const,
        match: null,
        grounding: "generated" as const,
        canCheckAnswer: true,
        result: await generateHints(data),
      };
    } catch (e) {
      console.error("hint generation failed", e);
      const status = (e as { statusCode?: number })?.statusCode;
      const message =
        status === 429
          ? "Gecko is busy — too many requests. Try again in a moment."
          : status === 402
            ? "AI credits ran out. Add credits in Settings → Plans & credits."
            : "Gecko couldn't verify a hint path for that problem. Try again or upload a clearer image.";
      return { ok: false as const, error: message };
    }
  });
