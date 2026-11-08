import { describe, expect, it } from "vitest";
import { splitMath, stripMathDelimiters } from "@/lib/math-text";

describe("splitMath", () => {
  it("splits prose and $...$ math segments", () => {
    expect(splitMath("Find $x^2 + y^2$ if $x$ and $y$ are positive integers.")).toEqual([
      { math: false, text: "Find " },
      { math: true, text: "x^2 + y^2" },
      { math: false, text: " if " },
      { math: true, text: "x" },
      { math: false, text: " and " },
      { math: true, text: "y" },
      { math: false, text: " are positive integers." },
    ]);
  });

  it("keeps an unclosed $ as prose", () => {
    expect(splitMath("costs $5 today")).toEqual([{ math: false, text: "costs $5 today" }]);
  });
});

describe("stripMathDelimiters", () => {
  it("turns log commands into plain notation", () => {
    expect(stripMathDelimiters("Find $\\log_x w$ now.")).toBe("Find log_x w now.");
  });

  it("writes fractions as (a)/(b), even with nested braces", () => {
    expect(stripMathDelimiters("let $x_n = \\dfrac{n}{x_{n-1}}$")).toBe("let x_n = (n)/(x_(n-1))");
  });

  it("writes roots with the radical symbol", () => {
    expect(stripMathDelimiters("$\\sqrt[4]{x} = \\dfrac{12}{7 - \\sqrt[4]{x}}$")).toBe("⁴√(x) = (12)/(7 - ⁴√(x))");
    expect(stripMathDelimiters("$\\sqrt{(31)(30)(29)(28) + 1}$")).toBe("√((31)(30)(29)(28) + 1)");
  });

  it("leaves plain text untouched", () => {
    expect(stripMathDelimiters("no math here")).toBe("no math here");
  });
});
