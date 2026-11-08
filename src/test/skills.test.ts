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

import { computeStarBreakdown, starsForAnswer } from "@/lib/skills";

describe("star scoring", () => {
  it("awards the problem's rating for a correct answer with no hints", () => {
    expect(starsForAnswer(3, 0, true)).toBe(3);
  });
  it("subtracts one star per hint", () => {
    expect(starsForAnswer(3, 2, true)).toBe(1);
  });
  it("never goes below zero", () => {
    expect(starsForAnswer(2, 5, true)).toBe(0);
  });
  it("awards nothing for a wrong answer", () => {
    expect(starsForAnswer(4, 0, false)).toBe(0);
  });
  it("credits every concept and counts each problem's best score once", () => {
    const stats = computeStarBreakdown([
      { problemId: "a", concepts: ["Algebra", "Exponents"], earnedStars: 0, possibleStars: 3 },
      { problemId: "a", concepts: ["Algebra", "Exponents"], earnedStars: 2, possibleStars: 3 },
      { problemId: "a", concepts: ["Algebra", "Exponents"], earnedStars: 2, possibleStars: 3 },
      { problemId: "b", concepts: ["Algebra"], earnedStars: 1, possibleStars: 1 },
    ]);
    expect(stats.find((s) => s.concept === "Algebra")).toEqual({ concept: "Algebra", earned: 3, possible: 4, problems: 2 });
    expect(stats.find((s) => s.concept === "Exponents")).toEqual({ concept: "Exponents", earned: 2, possible: 3, problems: 1 });
  });
});
