import { describe, expect, it } from "vitest";
import { accuracy, computeSkillBreakdown, earnedStars } from "@/lib/skills";

describe("earnedStars", () => {
  it("awards all five stars for a correct five-star question without hints", () => {
    expect(earnedStars(5, 0, true)).toBe(5);
  });
  it("subtracts one star per revealed hint", () => {
    expect(earnedStars(5, 2, true)).toBe(3);
    expect(earnedStars(3, 1, true)).toBe(2);
  });
  it("never awards negative stars", () => {
    expect(earnedStars(1, 4, true)).toBe(0);
  });
  it("awards zero for an incorrect answer", () => {
    expect(earnedStars(5, 0, false)).toBe(0);
  });
});

describe("computeSkillBreakdown", () => {
  it("sums earned and possible stars for every skill in each question", () => {
    expect(computeSkillBreakdown([
      { problemId: "a", correct: true, concepts: ["Algebra", "Logarithms"], earnedStars: 2, possibleStars: 3 },
      { problemId: "b", correct: false, concepts: ["Algebra"], earnedStars: 0, possibleStars: 5 },
    ])).toEqual([
      { concept: "Algebra", earned: 2, possible: 8 },
      { concept: "Logarithms", earned: 2, possible: 3 },
    ]);
  });
  it("counts each question once with its best score instead of farming repeated answers", () => {
    expect(computeSkillBreakdown([
      { problemId: "a", correct: false, concepts: ["Algebra"], earnedStars: 0, possibleStars: 3 },
      { problemId: "a", correct: true, concepts: ["Algebra"], earnedStars: 2, possibleStars: 3 },
      { problemId: "a", correct: true, concepts: ["Algebra"], earnedStars: 2, possibleStars: 3 },
    ])).toEqual([{ concept: "Algebra", earned: 2, possible: 3 }]);
  });
  it("returns an empty breakdown with no attempts", () => {
    expect(computeSkillBreakdown([])).toEqual([]);
  });
});

describe("accuracy", () => {
  it("calculates the rounded percentage of possible stars earned", () => {
    expect(accuracy({ earned: 2, possible: 3 })).toBe(67);
    expect(accuracy({ earned: 0, possible: 0 })).toBe(0);
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
