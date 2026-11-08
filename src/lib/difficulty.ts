export const DIFFICULTY_MIN = 1;
export const DIFFICULTY_MAX = 5;

/** Splits a difficulty rating into filled and empty star counts on the 1–5 scale. */
export function difficultyStars(value: number): { filled: number; empty: number } {
  const filled = Math.min(Math.max(Math.round(value), DIFFICULTY_MIN), DIFFICULTY_MAX);
  return { filled, empty: DIFFICULTY_MAX - filled };
}
