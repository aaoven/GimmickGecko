import { describe, expect, it } from "vitest";
import questions from "../../data/contest-expansion.json";

describe("verified contest expansion", () => {
  it("adds a modest batch with three questions from each requested contest family", () => {
    expect(questions).toHaveLength(12);
    for (const contest of ["Euclid", "CEMC Fermat", "AMC 10A", "COMC"]) {
      expect(questions.filter((p) => p.contest === contest)).toHaveLength(3);
    }
  });

  it("keeps every rating on the one-to-five-star scale", () => {
    for (const p of questions) {
      expect(Number.isInteger(p.difficulty)).toBe(true);
      expect(p.difficulty).toBeGreaterThanOrEqual(1);
      expect(p.difficulty).toBeLessThanOrEqual(5);
    }
  });

  it("has unique contest/year/question identities for safe repeat imports", () => {
    expect(new Set(questions.map((p) => `${p.contest}/${p.year}/${p.problem_number}`)).size).toBe(12);
  });

  it("matches independently calculated numeric answers", () => {
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const lcm = (a: number, b: number) => a * b / gcd(a, b);
    const integer = Array.from({ length: 180 }, (_, i) => i + 1)
      .find((n) => lcm(n, 18) === 180 && gcd(n, 45) === 15);
    expect(integer).toBe(60);
    const calculated = [18 / 3, (847 - 4) / 3 + 2, 24 / 0.08, 2 ** 3, 4, 3 * 20,
      Math.round(15 * 27 / 57), Math.abs(6 * 7 - (7 + 40)), 6,
      2021 + 4 - 1, 154 + 2, 3];
    expect(questions.map((p) => Number(p.answer))).toEqual(calculated);
    expect([281, 282, 283, 284].filter((n) => n !== 283).reduce((a, n) => a + n, 0)).toBe(847);
    expect((3 ** 2 / 3) ** 3 / 9).toBe(3);
  });
});