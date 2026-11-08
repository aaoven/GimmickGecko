export interface ConceptStat {
  concept: string;
  earned: number;
  possible: number;
}

export interface SkillAttempt {
  problemId: string;
  correct: boolean;
  concepts: string[];
  earnedStars: number;
  possibleStars: number;
}

export function earnedStars(rating: number, hints: number, correct: boolean): number {
  return correct ? Math.max(0, rating - hints) : 0;
}

/** Each attempted question contributes once, using its best earned score. */
export function computeSkillBreakdown(attempts: SkillAttempt[]): ConceptStat[] {
  const best = new Map<string, SkillAttempt>();
  for (const attempt of attempts) {
    const previous = best.get(attempt.problemId);
    if (!previous || attempt.earnedStars > previous.earnedStars) best.set(attempt.problemId, attempt);
  }
  const byConcept = new Map<string, ConceptStat>();
  for (const attempt of best.values()) {
    for (const concept of new Set(attempt.concepts)) {
      const stat = byConcept.get(concept) ?? { concept, earned: 0, possible: 0 };
      stat.earned += attempt.earnedStars;
      stat.possible += attempt.possibleStars;
      byConcept.set(concept, stat);
    }
  }
  return [...byConcept.values()].sort((a, b) => b.possible - a.possible || a.concept.localeCompare(b.concept));
}

export function accuracy(stat: { earned: number; possible: number }): number {
  return stat.possible === 0 ? 0 : Math.round((stat.earned / stat.possible) * 100);
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

/** Solved and answer-revealed bank questions never offer additional stars. */
export function availableProblemStars(rating: number, hints: number, solved: boolean, answerRevealed: boolean): number {
  return starsForAnswer(rating, hints, !solved && !answerRevealed);
}
