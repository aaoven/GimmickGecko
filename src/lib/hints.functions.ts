import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateHints } from "./hints.server";
import { isCorrectAnswer } from "./answers";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const hintInput = z
  .object({
    problem: z.string().max(5000),
    imageDataUrl: z
      .string()
      .max(6_000_000)
      .regex(/^data:image\/(png|jpe?g|webp|gif);base64,/)
      .optional(),
    /** Signed-in users save typed/uploaded problems so they count toward skills. */
    track: z.boolean().default(false),
  })
  .refine((d) => d.problem.trim() || d.imageDataUrl, "Add a problem or an image.");

/** Signed-in user id from the request bearer token, or null. */
async function optionalUserId(): Promise<string | null> {
  const { getRequestHeader } = await import("@tanstack/react-start/server");
  const auth = getRequestHeader("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.auth.getUser(auth.slice(7));
  return data.user?.id ?? null;
}

export const getHints = createServerFn({ method: "POST" })
  .inputValidator((data) => hintInput.parse(data))
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: rows } = await supabaseAdmin.from("problems").select("concepts");
      const known = [...new Set((rows ?? []).flatMap((r) => r.concepts as string[]))].sort();
      const result = await generateHints(data, known);
      let customId: string | null = null;
      const userId = data.track && result.isMathProblem ? await optionalUserId() : null;
      if (userId) {
        const { data: row } = await supabaseAdmin
          .from("custom_problems")
          .insert({ user_id: userId, statement: data.problem.slice(0, 5000), topic: result.topic, concepts: result.concepts, difficulty: result.difficulty, answer: result.answer })
          .select("id")
          .single();
        customId = row?.id ?? null;
      }
      return { ok: true as const, result, customId };
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

export const saveCustomHelp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), hints: z.number().int().min(0).max(100), answerRevealed: z.boolean().default(false) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("custom_problems").select("hints_revealed, answer_revealed").eq("id", data.id).eq("user_id", context.userId).single();
    if (!row) throw new Error("Problem not found.");
    const { error } = await supabaseAdmin
      .from("custom_problems")
      .update({ hints_revealed: Math.max(row.hints_revealed, data.hints), answer_revealed: row.answer_revealed || data.answerRevealed })
      .eq("id", data.id);
    if (error) throw new Error("Your hint usage could not be saved.");
    return { ok: true };
  });

export const checkCustomAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), answer: z.string().min(1).max(1000) }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("custom_problems").select("*").eq("id", data.id).eq("user_id", context.userId).single();
    if (!row) throw new Error("Problem not found.");
    const correct = isCorrectAnswer(data.answer, row.answer);
    const { data: graded, error } = await supabaseAdmin.rpc("grade_custom_answer", { _id: data.id, _user_id: context.userId, _correct: correct });
    const score = graded?.[0];
    if (error || !score) throw new Error("Your answer could not be saved.");
    return { correct: score.correct, earnedStars: score.earned_stars, possibleStars: score.possible_stars };
  });
