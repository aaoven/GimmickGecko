import { describe, expect, it } from "vitest";
import { accuracy, computeSkillBreakdown } from "@/lib/skills";

describe("computeSkillBreakdown", () => {
  it("counts correct and total per concept", () => {
    const stats = computeSkillBreakdown([
      { correct: true, concepts: ["Algebra", "Logarithms"] },
      { correct: false, concepts: ["Algebra"] },
    ]);
    expect(stats).toEqual([
      { concept: "Algebra", correct: 1, total: 2 },
      { concept: "Logarithms", correct: 1, total: 1 },
    ]);
  });

  it("sorts by most attempts, then alphabetically", () => {
    const stats = computeSkillBreakdown([
      { correct: true, concepts: ["Number Theory"] },
      { correct: true, concepts: ["Algebra", "Counting"] },
      { correct: false, concepts: ["Algebra", "Counting"] },
    ]);
    expect(stats.map((s) => s.concept)).toEqual(["Algebra", "Counting", "Number Theory"]);
  });

  it("returns an empty breakdown with no attempts", () => {
    expect(computeSkillBreakdown([])).toEqual([]);
  });
});

describe("accuracy", () => {
  it("is the rounded percentage of correct attempts", () => {
    expect(accuracy({ correct: 1, total: 2 })).toBe(50);
    expect(accuracy({ correct: 2, total: 3 })).toBe(67);
  });

  it("is zero with no attempts", () => {
    expect(accuracy({ correct: 0, total: 0 })).toBe(0);
  });
});
