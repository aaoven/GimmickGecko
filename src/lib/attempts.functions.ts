import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
