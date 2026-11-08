import { describe, expect, it } from "vitest";
import { isCorrectAnswer, splitAnswerParts } from "@/lib/answers";

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
  it("accepts the letter, value, or combined form of a multiple-choice answer", () => {
    expect(isCorrectAnswer("D", "22/23 (D)")).toBe(true);
    expect(isCorrectAnswer("d", "22/23 (D)")).toBe(true);
    expect(isCorrectAnswer("22/23", "22/23 (D)")).toBe(true);
    expect(isCorrectAnswer("22/23 (D)", "22/23 (D)")).toBe(true);
    expect(isCorrectAnswer("22/23 (d)", "22/23 (D)")).toBe(true);
    expect(isCorrectAnswer("D) 22/23", "22/23 (D)")).toBe(true);
    expect(isCorrectAnswer("(D) 22/23", "22/23 (D)")).toBe(true);
  });

  it("rejects wrong multiple-choice letters and values", () => {
    expect(isCorrectAnswer("A", "22/23 (D)")).toBe(false);
    expect(isCorrectAnswer("E", "22/23 (D)")).toBe(false);
    expect(isCorrectAnswer("23/22", "22/23 (D)")).toBe(false);
    expect(isCorrectAnswer("22/23 (A)", "22/23 (D)")).toBe(false);
    expect(isCorrectAnswer("23/22 (A)", "22/23 (D)")).toBe(false);
  });

  it("accepts equivalent values for a multiple-choice answer", () => {
    expect(isCorrectAnswer("44/46", "22/23 (D)")).toBe(true);
    expect(isCorrectAnswer("0.5", "1/2 (B)")).toBe(true);
  });

  it("accepts a letter-only expected answer", () => {
    expect(isCorrectAnswer("d", "D")).toBe(true);
    expect(isCorrectAnswer("A", "D")).toBe(false);
  });

  it("splits multiple-choice answers into letter and value", () => {
    expect(splitAnswerParts("22/23 (D)")).toEqual({ letter: "D", value: "22/23" });
    expect(splitAnswerParts("(d) 3/4")).toEqual({ letter: "D", value: "3/4" });
    expect(splitAnswerParts("B")).toEqual({ letter: "B", value: null });
    expect(splitAnswerParts("60")).toEqual({ letter: null, value: "60" });
    expect(splitAnswerParts("-2/3")).toEqual({ letter: null, value: "-2/3" });
  });

  it("treats equivalent radicals as correct", () => {
    expect(isCorrectAnswer("root 12", "2root 3")).toBe(true);
    expect(isCorrectAnswer("root 12", "2 root 3")).toBe(true);
    expect(isCorrectAnswer("2root 3", "root 12")).toBe(true);
    expect(isCorrectAnswer("2√3", "sqrt(12)")).toBe(true);
    expect(isCorrectAnswer("√12", "2sqrt(3)")).toBe(true);
    expect(isCorrectAnswer("root 13", "2root 3")).toBe(false);
  });

  it("rejects unequal or unsafe expressions", () => {
    expect(isCorrectAnswer("root 2", "sqrt(3)")).toBe(false);
    expect(isCorrectAnswer("1.732", "sqrt(3)")).toBe(false);
    expect(isCorrectAnswer("a=3", "3")).toBe(false);
    expect(isCorrectAnswer("evaluate('3')", "3")).toBe(false);
  });
});
