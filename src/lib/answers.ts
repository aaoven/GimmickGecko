/** Normalizes an answer for comparison: trims, lowercases, drops spaces and commas. */
export function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase().replace(/[\s,]+/g, "");
}

/**
 * Checks a submitted answer against the expected one.
 * Exact match after normalization, or numeric equality so "060" matches "60".
 */
export function isCorrectAnswer(given: string, expected: string): boolean {
  const g = normalizeAnswer(given);
  const e = normalizeAnswer(expected);
  if (!g || !e) return false;
  if (g === e) return true;
  const gn = Number(g);
  const en = Number(e);
  return Number.isFinite(gn) && Number.isFinite(en) && gn === en;
}
