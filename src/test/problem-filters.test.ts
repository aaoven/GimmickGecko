import { describe, expect, it } from "vitest";
import { hasAvailableStars, remainingProblemStars } from "@/lib/problem-filters";

describe("available stars filter", () => {
  const problem = { id: "a", difficulty: 2 };
  it("returns exact remaining counts from zero through five", () => {
    for (const stars of [0, 1, 2, 3, 4, 5]) {
      expect(remainingProblemStars({ id: "a", difficulty: 5 }, { help: [], solved: [], incorrect: { a: 5 - stars } })).toBe(stars);
    }
  });
  it("counts solved and revealed problems as zero remaining", () => {
    expect(remainingProblemStars(problem, { help: [], solved: ["a"], incorrect: {} })).toBe(0);
    expect(remainingProblemStars(problem, { help: [{ problem_id: "a", hints_revealed: 0, answer_revealed: true }], solved: [], incorrect: {} })).toBe(0);
  });
  it("keeps questions with a remaining reward", () => {
    expect(hasAvailableStars(problem, { help: [], solved: [], incorrect: { a: 1 } })).toBe(true);
  });
  it("excludes exhausted, solved, and revealed questions", () => {
    expect(hasAvailableStars(problem, { help: [], solved: [], incorrect: { a: 2 } })).toBe(false);
    expect(hasAvailableStars(problem, { help: [], solved: ["a"], incorrect: {} })).toBe(false);
    expect(hasAvailableStars(problem, { help: [{ problem_id: "a", hints_revealed: 0, answer_revealed: true }], solved: [], incorrect: {} })).toBe(false);
  });
});