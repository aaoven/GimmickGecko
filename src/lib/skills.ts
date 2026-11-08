export interface ConceptStat {
  concept: string;
  correct: number;
  total: number;
}

/**
 * Aggregates answer attempts into per-concept stats.
 * An attempt counts toward every concept its problem requires.
 * Sorted by most attempted first, then alphabetically.
 */
export function computeSkillBreakdown(attempts: Array<{ correct: boolean; concepts: string[] }>): ConceptStat[] {
  const byConcept = new Map<string, { correct: number; total: number }>();
  for (const attempt of attempts) {
    for (const concept of attempt.concepts) {
      const stat = byConcept.get(concept) ?? { correct: 0, total: 0 };
      stat.total += 1;
      if (attempt.correct) stat.correct += 1;
      byConcept.set(concept, stat);
    }
  }
  return [...byConcept.entries()]
    .map(([concept, stat]) => ({ concept, ...stat }))
    .sort((a, b) => b.total - a.total || a.concept.localeCompare(b.concept));
}

/** Rounded accuracy percentage for one concept. */
export function accuracy(stat: { correct: number; total: number }): number {
  return stat.total === 0 ? 0 : Math.round((stat.correct / stat.total) * 100);
}

export interface StarAttempt {
  problemId: string;
  concepts: string[];
  earnedStars: number;
  possibleStars: number;
}

export interface ConceptStars {
  concept: string;
  earned: number;
  possible: number;
  problems: number;
}

/**
 * Per-concept star totals. Each distinct problem counts once, using the
 * user's best earned score on it, so re-answering can't inflate totals.
 * Sorted by most stars earned, then alphabetically.
 */
export function computeStarBreakdown(attempts: StarAttempt[]): ConceptStars[] {
  const best = new Map<string, StarAttempt>();
  for (const a of attempts) {
    const prev = best.get(a.problemId);
    if (!prev || a.earnedStars > prev.earnedStars) best.set(a.problemId, a);
  }
  const byConcept = new Map<string, ConceptStars>();
  for (const a of best.values()) {
    for (const concept of a.concepts) {
      const s = byConcept.get(concept) ?? { concept, earned: 0, possible: 0, problems: 0 };
      s.earned += a.earnedStars;
      s.possible += a.possibleStars;
      s.problems += 1;
      byConcept.set(concept, s);
    }
  }
  return [...byConcept.values()].sort((a, b) => b.earned - a.earned || a.concept.localeCompare(b.concept));
}

/** Stars a correct answer earns: the rating minus one per hint, never below zero. */
export function starsForAnswer(rating: number, hints: number, correct: boolean): number {
  return correct ? Math.max(0, rating - hints) : 0;
}
