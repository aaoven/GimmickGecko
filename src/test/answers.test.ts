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
});
