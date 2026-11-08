import { describe, expect, it } from "vitest";
import { matchProblem } from "@/lib/problem-match";
const problem = {
  id: "one",
  statement:
    "Three friends share 24 apples equally. Each friend eats 2 apples before lunch. How many apples remain for each friend after lunch?",
};
describe("conservative question retrieval", () => {
  it("preserves numeric order and operations rather than only matching a bag of words", () => {
    const equation = {
      statement: "A student has integers x and y such that x + 3 = 7. Find the value of x.",
    };
    expect(matchProblem(equation.statement.replace("+ 3 = 7", "+ 7 = 3"), [equation])).toBeNull();
    expect(matchProblem(equation.statement.replace("x + 3", "x - 3"), [equation])).toBeNull();
  });
  it("finds a question despite punctuation, case and spacing changes", () => {
    expect(matchProblem(problem.statement.toUpperCase().replaceAll(".", "\n"), [problem])).toBe(
      problem,
    );
  });
  it("does not confuse questions that differ only in their numbers", () => {
    expect(matchProblem(problem.statement.replace("24", "27"), [problem])).toBeNull();
  });
  it("abstains for ambiguous copies and short generic prompts", () => {
    expect(matchProblem(problem.statement, [problem, { ...problem, id: "two" }])).toBeNull();
    expect(matchProblem("Find x", [problem])).toBeNull();
  });
});
