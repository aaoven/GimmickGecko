import { describe, expect, it } from "vitest";
import { hasAvailableStars } from "@/lib/problem-filters";

describe("available stars filter", () => {
  const problem = { id: "a", difficulty: 2 };
  it("keeps questions with a remaining reward", () => {
    expect(hasAvailableStars(problem, { help: [], solved: [], incorrect: { a: 1 } })).toBe(true);
  });
  it("excludes exhausted, solved, and revealed questions", () => {
    expect(hasAvailableStars(problem, { help: [], solved: [], incorrect: { a: 2 } })).toBe(false);
    expect(hasAvailableStars(problem, { help: [], solved: ["a"], incorrect: {} })).toBe(false);
    expect(hasAvailableStars(problem, { help: [{ problem_id: "a", hints_revealed: 0, answer_revealed: true }], solved: [], incorrect: {} })).toBe(false);
  });
});