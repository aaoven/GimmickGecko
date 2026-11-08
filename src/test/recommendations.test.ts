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
  it("orders concepts by lowest accuracy first", () => {
    const weak = weakestConcepts([
      { correct: true, concepts: ["Algebra"] },
      { correct: true, concepts: ["Algebra"] },
      { correct: false, concepts: ["Geometry"] },
      { correct: false, concepts: ["Geometry"] },
    ]);
    expect(weak.map((s) => s.concept)).toEqual(["Geometry", "Algebra"]);
  });

  it("returns nothing with no attempts", () => {
    expect(weakestConcepts([])).toEqual([]);
  });
});

describe("recommendProblems", () => {
  it("suggests unsolved problems targeting the weakest concepts", () => {
    const recs = recommendProblems(
      [
        { problemId: "p1", correct: true, concepts: ["Algebra"] },
        { problemId: "p2", correct: false, concepts: ["Geometry"] },
      ],
      bank,
    );
    expect(recs.map((p) => p.id)).toContain("p5");
    expect(recs.map((p) => p.id)).not.toContain("p4");
  });

  it("never suggests a problem already solved correctly", () => {
    const recs = recommendProblems(
      [{ problemId: "p2", correct: true, concepts: ["Geometry"] }],
      bank,
    );
    expect(recs.map((p) => p.id)).not.toContain("p2");
  });

  it("prefers problems hitting more weak concepts, then easier ones", () => {
    const recs = recommendProblems(
      [
        { problemId: "p1", correct: false, concepts: ["Algebra"] },
        { problemId: "p2", correct: false, concepts: ["Geometry"] },
      ],
      bank,
    );
    expect(recs.map((p) => p.id)).toEqual(["p3", "p1", "p5", "p2"]);
  });

  it("falls back to the easiest unsolved problems when no weak concept matches", () => {
    const recs = recommendProblems(
      [{ problemId: "p2", correct: false, concepts: ["Counting"] }],
      bank,
    );
    expect(recs.map((p) => p.id)).toEqual(["p1", "p4", "p5", "p2"]);
  });

  it("is empty with no attempts or when the whole bank is solved", () => {
    expect(recommendProblems([], bank)).toEqual([]);
    const allSolved = bank.map((p) => ({ problemId: p.id, correct: true, concepts: p.concepts }));
    expect(recommendProblems(allSolved, bank)).toEqual([]);
  });
});
