import { describe, expect, it } from "vitest";
import { splitMath, stripMathDelimiters } from "@/lib/math-text";

describe("splitMath", () => {
  it("supports source TeX delimiters and display equations", () => {
    expect(splitMath(String.raw`Find \(x+1\). \[x^2=4\] $$y=2$$`)).toEqual([
      { math: false, text: "Find " },
      { math: true, text: "x+1" },
      { math: false, text: ". " },
      { math: true, text: "x^2=4", display: true },
      { math: false, text: " " },
      { math: true, text: "y=2", display: true },
    ]);
  });
  it("preserves prices and escaped dollars within equations", () => {
    expect(splitMath("It costs $20 and $5 today.")).toEqual([
      { math: false, text: "It costs $20 and $5 today." },
    ]);
    expect(splitMath(String.raw`Pay \$20. $x=\$5$`)).toEqual([
      { math: false, text: "Pay $20. " },
      { math: true, text: String.raw`x=\$5` },
    ]);
  });
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
  it("handles currency followed by a later mathematical expression", () => {
    expect(splitMath("Pay $20 and $5 more. Find $x$. ")).toEqual([
      { math: false, text: "Pay $20 and $5 more. Find " },
      { math: true, text: "x" },
      { math: false, text: ". " },
    ]);
  });
  it("turns log commands into plain notation", () => {
    expect(stripMathDelimiters("Find $\\log_x w$ now.")).toBe("Find log_x w now.");
  });

  it("writes fractions as (a)/(b), even with nested braces", () => {
    expect(stripMathDelimiters("let $x_n = \\dfrac{n}{x_{n-1}}$")).toBe("let x_n = (n)/(x_(n-1))");
  });

  it("writes roots with the radical symbol", () => {
    expect(stripMathDelimiters("$\\sqrt[4]{x} = \\dfrac{12}{7 - \\sqrt[4]{x}}$")).toBe(
      "⁴√(x) = (12)/(7 - ⁴√(x))",
    );
    expect(stripMathDelimiters("$\\sqrt{(31)(30)(29)(28) + 1}$")).toBe("√((31)(30)(29)(28) + 1)");
  });

  it("leaves plain text untouched", () => {
    expect(stripMathDelimiters("no math here")).toBe("no math here");
  });
});
