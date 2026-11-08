import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isCorrectAnswer } from "@/lib/answers";

export const recordAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ problemId: z.string().uuid(), answer: z.string().min(1).max(1000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: problem, error: problemError } = await context.supabase
      .from("problems")
      .select("answer")
      .eq("id", data.problemId)
      .single();
    if (problemError || problem?.answer == null)
      throw new Error("This problem could not be checked.");
    const correct = isCorrectAnswer(data.answer, problem.answer);
    const { data: attempt, error } = await context.supabase
      .from("attempts")
      .insert({ user_id: context.userId, problem_id: data.problemId, correct })
      .select("earned_stars, possible_stars")
      .single();
    if (error) throw new Error("Your attempt could not be saved.");
    return { correct, earnedStars: attempt.earned_stars, possibleStars: attempt.possible_stars };
  });

export const getMyAttempts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { attemptHistory } = await import("./practice.server");
    return attemptHistory(context.supabase);
  });

export const getRecommendations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { practiceRecommendations } = await import("./practice.server");
    return practiceRecommendations(context.supabase);
  });

export const saveProblemHelp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        problemId: z.string().uuid(),
        hints: z.number().int().min(0).max(100),
        answerRevealed: z.boolean().default(false),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("save_problem_help", {
      _problem_id: data.problemId,
      _hints: data.hints,
      _answer_revealed: data.answerRevealed,
    });
    if (error) throw new Error("Your hint usage could not be saved. Try again.");
    return { ok: true };
  });
