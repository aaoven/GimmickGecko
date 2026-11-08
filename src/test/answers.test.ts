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

  it("compares fractions and decimals exactly", () => {
    expect(isCorrectAnswer("0.5", "1/2")).toBe(true);
    expect(isCorrectAnswer(".5", "1/2")).toBe(true);
    expect(isCorrectAnswer("2/4", "\\frac{1}{2}")).toBe(true);
    expect(isCorrectAnswer("-1 1/2", "-3/2")).toBe(true);
    expect(isCorrectAnswer("1/0", "1/0")).toBe(false);
    expect(isCorrectAnswer("0.333333", "1/3")).toBe(false);
  });

  it("preserves ordered tuple boundaries", () => {
    expect(isCorrectAnswer("(1, 2/4)", "(1, 0.5)")).toBe(true);
    expect(isCorrectAnswer("(1,23)", "(12,3)")).toBe(false);
    expect(isCorrectAnswer("123", "(1,2,3)")).toBe(false);
  });

  it("accepts choice labels and percentage notation", () => {
    expect(isCorrectAnswer("f", "(F)")).toBe(true);
    expect(isCorrectAnswer("25", "25%")).toBe(true);
    expect(isCorrectAnswer("25%", "0.25")).toBe(true);
    expect(isCorrectAnswer("0.25", "25%")).toBe(false);
  });

  it("rejects ambiguous PDF digits and non-finite values", () => {
    expect(isCorrectAnswer("250101", "250\n101")).toBe(false);
    expect(isCorrectAnswer("12", "1 2")).toBe(false);
    expect(isCorrectAnswer("2+2", "4")).toBe(false);
    expect(isCorrectAnswer("Infinity", "Infinity")).toBe(false);
    expect(isCorrectAnswer("1e100000000", "1")).toBe(false);
  });
});
