import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { recommendProblems, weakestConcepts } from "@/lib/recommendations";
import { isCorrectAnswer } from "@/lib/answers";
import type { Problem } from "@/lib/problems.functions";
import { includeRevealedProblems } from "@/lib/skills";

export const recordAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ problemId: z.string().uuid(), answer: z.string().min(1).max(1000) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: problem, error: problemError } = await context.supabase.from("problems").select("answer, difficulty").eq("id", data.problemId).single();
    if (problemError || problem?.answer == null) throw new Error("This problem could not be checked.");
    const correct = isCorrectAnswer(data.answer, problem.answer);
    const { data: solved, error: solvedError } = await context.supabase.from("attempts")
      .select("problem_id").eq("user_id", context.userId).eq("problem_id", data.problemId).eq("correct", true).limit(1);
    if (solvedError) throw new Error("Your previous attempts could not be loaded.");
    if (solved?.length) return { correct, earnedStars: 0, possibleStars: problem.difficulty };
    const { data: attempt, error } = await context.supabase
      .from("attempts")
      .insert({ user_id: context.userId, problem_id: data.problemId, correct })
      .select("earned_stars, possible_stars").single();
    if (error) throw new Error("Your attempt could not be saved.");
    return { correct, earnedStars: attempt.earned_stars, possibleStars: attempt.possible_stars };
  });

export const getMyAttempts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("attempts")
      .select("problem_id, correct, earned_stars, possible_stars, problems(concepts)")
      .order("created_at", { ascending: true });
    if (error) throw new Error("Your attempts could not be loaded.");
    const { data: custom, error: customError } = await context.supabase
      .from("custom_problems")
      .select("id, solved, earned_stars, difficulty, concepts")
      .eq("attempted", true);
    if (customError) throw new Error("Your attempts could not be loaded.");
    const { data: revealed, error: revealError } = await context.supabase.from("problem_help")
      .select("problem_id, problems(difficulty, concepts)").eq("user_id", context.userId).eq("answer_revealed", true);
    if (revealError) throw new Error("Your revealed answers could not be loaded.");
    return [
      ...includeRevealedProblems((data ?? []).map((row) => ({
        problemId: row.problem_id,
        correct: row.correct,
        earnedStars: row.earned_stars,
        possibleStars: row.possible_stars,
        concepts: (row.problems as unknown as { concepts: string[] } | null)?.concepts ?? [],
      })), (revealed ?? []).flatMap((row) => {
        const problem = row.problems as unknown as { difficulty: number; concepts: string[] } | null;
        return problem ? [{ problemId: row.problem_id, difficulty: problem.difficulty, concepts: problem.concepts }] : [];
      })),
      ...(custom ?? []).map((row) => ({
        problemId: `custom:${row.id}`,
        correct: row.solved,
        earnedStars: row.earned_stars,
        possibleStars: row.difficulty,
        concepts: row.concepts,
      })),
    ];
  });

export const getRecommendations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: attempts, error: attemptsError } = await context.supabase
      .from("attempts")
      .select("problem_id, correct, earned_stars, possible_stars, problems(concepts)");
    if (attemptsError) throw new Error("Your attempts could not be loaded.");
    const { data: problems, error: problemsError } = await context.supabase
      .from("problems")
      .select("*")
      .order("year", { ascending: true })
      .order("problem_number", { ascending: true });
    if (problemsError) throw new Error("Problems could not be loaded.");
    const { data: revealed, error: revealError } = await context.supabase.from("problem_help")
      .select("problem_id, problems(difficulty, concepts)").eq("user_id", context.userId).eq("answer_revealed", true);
    if (revealError) throw new Error("Your revealed answers could not be loaded.");
    const records = includeRevealedProblems((attempts ?? []).map((row) => ({
      problemId: row.problem_id,
      correct: row.correct,
      earnedStars: row.earned_stars,
      possibleStars: row.possible_stars,
      concepts: (row.problems as unknown as { concepts: string[] } | null)?.concepts ?? [],
    })), (revealed ?? []).flatMap((row) => {
      const problem = row.problems as unknown as { difficulty: number; concepts: string[] } | null;
      return problem ? [{ problemId: row.problem_id, difficulty: problem.difficulty, concepts: problem.concepts }] : [];
    }));
    return {
      weakest: weakestConcepts(records),
      problems: recommendProblems(records, (problems ?? []) as Problem[]),
    };
  });

export const saveProblemHelp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ problemId: z.string().uuid(), hints: z.number().int().min(0).max(100), answerRevealed: z.boolean().default(false) }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc("save_problem_help", { _problem_id: data.problemId, _hints: data.hints, _answer_revealed: data.answerRevealed });
    if (error) throw new Error("Your hint usage could not be saved. Try again.");
    return { ok: true };
  });

export const getBankProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [help, attempts] = await Promise.all([
      context.supabase.from("problem_help").select("problem_id, hints_revealed, answer_revealed").eq("user_id", context.userId),
      context.supabase.from("attempts").select("problem_id").eq("user_id", context.userId).eq("correct", true),
    ]);
    if (help.error || attempts.error) throw new Error("Your problem progress could not be loaded.");
    return { help: help.data ?? [], solved: [...new Set((attempts.data ?? []).map((row) => row.problem_id))] };
  });
