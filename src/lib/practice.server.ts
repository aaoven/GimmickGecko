import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { SkillAttempt } from "./skills";
import { recommendProblems, weakestConcepts } from "./recommendations";

export async function attemptHistory(db: SupabaseClient<Database>): Promise<SkillAttempt[]> {
  const attempts: SkillAttempt[] = [];
  for (let start = 0; ; start += 1000) {
    const { data, error } = await db
      .from("attempts")
      .select("problem_id,correct,earned_stars,possible_stars,problems(concepts)")
      .order("created_at")
      .order("id")
      .range(start, start + 999);
    if (error) throw new Error("Your attempts could not be loaded.");
    for (const row of data ?? [])
      attempts.push({
        problemId: row.problem_id,
        correct: row.correct,
        earnedStars: row.earned_stars,
        possibleStars: row.possible_stars,
        concepts: row.problems?.concepts ?? [],
      });
    if (!data || data.length < 1000) return attempts;
  }
}

export async function practiceRecommendations(db: SupabaseClient<Database>) {
  const attempts = await attemptHistory(db);
  const weakest = weakestConcepts(attempts);
  if (!attempts.length) return { weakest, problems: [] };
  // Rank small metadata records across the entire shared bank, then fetch four statements.
  const candidates: { id: string; concepts: string[]; difficulty: number }[] = [];
  for (let start = 0; ; start += 1000) {
    const { data, error } = await db
      .from("problems")
      .select("id,concepts,difficulty")
      .order("id")
      .range(start, start + 999);
    if (error) throw new Error("Practice recommendations could not be loaded.");
    candidates.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  const ids = recommendProblems(attempts, candidates).map((p) => p.id);
  if (!ids.length) return { weakest, problems: [] };
  const { data, error } = await db.from("problems").select("*").in("id", ids);
  if (error) throw new Error("Practice recommendations could not be loaded.");
  return { weakest, problems: ids.flatMap((id) => data?.filter((p) => p.id === id) ?? []) };
}
