import { accuracy, computeSkillBreakdown, type ConceptStat, type SkillAttempt } from "@/lib/skills";

export type AttemptRecord = SkillAttempt;

export interface RecommendableProblem {
  id: string;
  concepts: string[];
  difficulty: number;
}

/**
 * The concepts with the user's lowest earned-star percentage, most attempted first on ties.
 * These come from the same per-concept stats as the skillset breakdown.
 */
export function weakestConcepts(
  attempts: SkillAttempt[],
  count = 3,
): ConceptStat[] {
  return computeSkillBreakdown(attempts)
    .sort((a, b) => accuracy(a) - accuracy(b) || b.possible - a.possible || a.concept.localeCompare(b.concept))
    .slice(0, count);
}

/**
 * Suggests bank problems that train the user's weakest concepts.
 * Skips problems already solved correctly, prefers problems hitting more weak
 * concepts, then easier ones. When nothing targets a weak concept any more,
 * falls back to the easiest unsolved problems. Empty when the user has no
 * attempts or has solved the whole bank.
 */
export function recommendProblems<T extends RecommendableProblem>(
  attempts: AttemptRecord[],
  problems: T[],
  count = 4,
): T[] {
  if (attempts.length === 0) return [];
  const solved = new Set(attempts.filter((a) => a.correct).map((a) => a.problemId));
  const unsolved = problems.filter((p) => !solved.has(p.id));
  const weak = new Set(weakestConcepts(attempts).map((s) => s.concept));
  const targeted = unsolved
    .map((problem) => ({ problem, hits: problem.concepts.filter((c) => weak.has(c)).length }))
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits || a.problem.difficulty - b.problem.difficulty)
    .map((x) => x.problem);
  const pool = targeted.length > 0 ? targeted : [...unsolved].sort((a, b) => a.difficulty - b.difficulty);
  return pool.slice(0, count);
}
