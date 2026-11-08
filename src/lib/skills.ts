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
