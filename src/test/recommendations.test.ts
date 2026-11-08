import { describe, expect, it } from "vitest";
import { recommendProblems, weakestConcepts } from "@/lib/recommendations";

const bank = [
  { id: "p1", concepts: ["Algebra"], difficulty: 1 },
  { id: "p2", concepts: ["Geometry"], difficulty: 2 },
  { id: "p3", concepts: ["Geometry", "Algebra"], difficulty: 3 },
  { id: "p4", concepts: ["Number Theory"], difficulty: 1 },
  { id: "p5", concepts: ["Geometry"], difficulty: 1 },
];

describe("weakestConcepts", () => {
  it("orders concepts by lowest earned-star percentage first", () => {
    const weak = weakestConcepts([
      { problemId: "a", correct: true, concepts: ["Algebra"], earnedStars: 1, possibleStars: 1 },
      { problemId: "a", correct: true, concepts: ["Algebra"], earnedStars: 1, possibleStars: 1 },
      { problemId: "g", correct: false, concepts: ["Geometry"], earnedStars: 0, possibleStars: 2 },
      { problemId: "g", correct: false, concepts: ["Geometry"], earnedStars: 0, possibleStars: 2 },
    ]);
    expect(weak.map((s) => s.concept)).toEqual(["Geometry", "Algebra"]);
  });

  it("treats correct answers with hint penalties as weaker than full-star answers", () => {
    const weak = weakestConcepts([
      { problemId: "a", correct: true, concepts: ["Algebra"], earnedStars: 1, possibleStars: 5 },
      { problemId: "g", correct: true, concepts: ["Geometry"], earnedStars: 2, possibleStars: 2 },
    ]);
    expect(weak.map((s) => s.concept)).toEqual(["Algebra", "Geometry"]);
  });

  it("returns nothing with no attempts", () => {
    expect(weakestConcepts([])).toEqual([]);
  });
});

describe("recommendProblems", () => {
  it("suggests unsolved problems targeting the weakest concepts", () => {
    const recs = recommendProblems(
      [
        { problemId: "p1", correct: true, concepts: ["Algebra"], earnedStars: 1, possibleStars: 1 },
        { problemId: "p2", correct: false, concepts: ["Geometry"], earnedStars: 0, possibleStars: 1 },
      ],
      bank,
    );
    expect(recs.map((p) => p.id)).toContain("p5");
    expect(recs.map((p) => p.id)).not.toContain("p4");
  });

  it("never suggests a problem already solved correctly", () => {
    const recs = recommendProblems(
      [{ problemId: "p2", correct: true, concepts: ["Geometry"], earnedStars: 1, possibleStars: 1 }],
      bank,
    );
    expect(recs.map((p) => p.id)).not.toContain("p2");
  });

  it("prefers problems hitting more weak concepts, then easier ones", () => {
    const recs = recommendProblems(
      [
        { problemId: "p1", correct: false, concepts: ["Algebra"], earnedStars: 0, possibleStars: 1 },
        { problemId: "p2", correct: false, concepts: ["Geometry"], earnedStars: 0, possibleStars: 1 },
      ],
      bank,
    );
    expect(recs.map((p) => p.id)).toEqual(["p3", "p1", "p5", "p2"]);
  });

  it("falls back to the easiest unsolved problems when no weak concept matches", () => {
    const recs = recommendProblems(
      [{ problemId: "p2", correct: false, concepts: ["Counting"], earnedStars: 0, possibleStars: 1 }],
      bank,
    );
    expect(recs.map((p) => p.id)).toEqual(["p1", "p4", "p5", "p2"]);
  });

  it("is empty with no attempts or when the whole bank is solved", () => {
    expect(recommendProblems([], bank)).toEqual([]);
    const allSolved = bank.map((p) => ({ problemId: p.id, correct: true, concepts: p.concepts, earnedStars: p.difficulty, possibleStars: p.difficulty }));
    expect(recommendProblems(allSolved, bank)).toEqual([]);
  });
});
