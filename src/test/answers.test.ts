import { describe, expect, it } from "vitest";
import { isCorrectAnswer } from "@/lib/answers";

describe("isCorrectAnswer", () => {
  it("accepts an exact match", () => {
    expect(isCorrectAnswer("60", "60")).toBe(true);
  });

  it("ignores surrounding whitespace, case, and commas", () => {
    expect(isCorrectAnswer("  60  ", "60")).toBe(true);
    expect(isCorrectAnswer("1,492", "1492")).toBe(true);
    expect(isCorrectAnswer("ABC", "abc")).toBe(true);
  });

  it("treats numerically equal answers as correct", () => {
    expect(isCorrectAnswer("060", "60")).toBe(true);
  });

  it("rejects a wrong answer", () => {
    expect(isCorrectAnswer("61", "60")).toBe(false);
  });

  it("rejects an empty answer", () => {
    expect(isCorrectAnswer("   ", "60")).toBe(false);
  });
  it("accepts root 3 as sqrt(3)", () => {
    expect(isCorrectAnswer("root 3", "sqrt(3)")).toBe(true);
    expect(isCorrectAnswer("√3", "sqrt(3)")).toBe(true);
  });
  it("accepts equivalent fractions and arithmetic", () => {
    expect(isCorrectAnswer("2/4", "0.5")).toBe(true);
    expect(isCorrectAnswer("2*sqrt(3)", "sqrt(12)")).toBe(true);
  });
  it("accepts math-keyboard LaTeX forms", () => {
    expect(isCorrectAnswer("\\frac{1}{2}", "0.5")).toBe(true);
    expect(isCorrectAnswer("2^{3}", "8")).toBe(true);
    expect(isCorrectAnswer("\\pi", "3.141592653589793")).toBe(true);
    expect(isCorrectAnswer("30^\\circ", "30")).toBe(true);
    expect(isCorrectAnswer("\\left|-3\\right|", "3")).toBe(true);
    expect(isCorrectAnswer("2\\times 3", "6")).toBe(true);
    expect(isCorrectAnswer("6\\div 2", "3")).toBe(true);
  });
  it("rejects unequal or unsafe expressions", () => {
    expect(isCorrectAnswer("root 2", "sqrt(3)")).toBe(false);
    expect(isCorrectAnswer("1.732", "sqrt(3)")).toBe(false);
    expect(isCorrectAnswer("a=3", "3")).toBe(false);
    expect(isCorrectAnswer("evaluate('3')", "3")).toBe(false);
  });
});
