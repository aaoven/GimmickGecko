import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { recommendProblems, weakestConcepts } from "@/lib/recommendations";
import type { Problem } from "@/lib/problems.functions";

export const recordAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ problemId: z.string().uuid(), correct: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("attempts")
      .insert({ user_id: context.userId, problem_id: data.problemId, correct: data.correct });
    if (error) throw new Error("Your attempt could not be saved.");
    return { ok: true as const };
  });

export const getMyAttempts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("attempts")
      .select("correct, problems(concepts)")
      .order("created_at", { ascending: true });
    if (error) throw new Error("Your attempts could not be loaded.");
    return (data ?? []).map((row) => ({
      correct: row.correct,
      concepts: (row.problems as unknown as { concepts: string[] } | null)?.concepts ?? [],
    }));
  });

export const getRecommendations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: attempts, error: attemptsError } = await context.supabase
      .from("attempts")
      .select("problem_id, correct, problems(concepts)");
    if (attemptsError) throw new Error("Your attempts could not be loaded.");
    const { data: problems, error: problemsError } = await context.supabase
      .from("problems")
      .select("*")
      .order("year", { ascending: true })
      .order("problem_number", { ascending: true });
    if (problemsError) throw new Error("Problems could not be loaded.");
    const records = (attempts ?? []).map((row) => ({
      problemId: row.problem_id,
      correct: row.correct,
      concepts: (row.problems as unknown as { concepts: string[] } | null)?.concepts ?? [],
    }));
    return {
      weakest: weakestConcepts(records),
      problems: recommendProblems(records, (problems ?? []) as Problem[]),
    };
  });

/** Persists how much help (hints / answer reveal) the user used on a bank problem. Only ever increases. */
export const saveProblemHelp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ problemId: z.string().uuid(), hints: z.number().int().min(0).max(100), answerRevealed: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("save_problem_help", {
      _problem_id: data.problemId,
      _hints: data.hints,
      _answer_revealed: data.answerRevealed,
    });
    if (error) throw new Error("Hint usage could not be saved.");
    return { ok: true as const };
  });
