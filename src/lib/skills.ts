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
