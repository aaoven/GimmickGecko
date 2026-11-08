import { describe, expect, it } from "vitest";
import { hintInputSchema, hintSchema } from "@/lib/hints-schema";

const sample = {
  topic: "Algebra",
  concepts: ["Equations"],
  gimmick: "Change the representation.",
  hints: [
    "Look for structure.",
    "Introduce a variable.",
    "Rearrange the relation.",
    "Simplify your expression.",
  ],
  answer: "6",
};

describe("hint contracts", () => {
  it("requires exactly four nonempty hints", () => {
    expect(hintSchema.safeParse(sample).success).toBe(true);
    expect(hintSchema.safeParse({ ...sample, hints: sample.hints.slice(0, 3) }).success).toBe(
      false,
    );
    expect(hintSchema.safeParse({ ...sample, hints: [...sample.hints, "Extra"] }).success).toBe(
      false,
    );
    expect(hintSchema.safeParse({ ...sample, hints: ["", ...sample.hints.slice(1)] }).success).toBe(
      false,
    );
  });
  it("accepts a bank ID without trusting a client-supplied statement", () => {
    const input = hintInputSchema.parse({ problemId: "6b63aeda-cfea-4b52-b2d6-e54779ee3e2e" });
    expect(input.problem).toBe("");
    expect(input.problemId).toBeDefined();
  });
  it("rejects missing input, malformed IDs and unsupported images", () => {
    expect(hintInputSchema.safeParse({}).success).toBe(false);
    expect(hintInputSchema.safeParse({ problemId: "not-an-id" }).success).toBe(false);
    expect(
      hintInputSchema.safeParse({ imageDataUrl: "data:image/svg+xml;base64,anything" }).success,
    ).toBe(false);
  });
});
