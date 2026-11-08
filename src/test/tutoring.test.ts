import { describe, expect, it } from "vitest";
import { selectReferenceSolution, tutoringRecordSchema } from "@/lib/tutoring";
import { problemSearchSchema, searchWords } from "@/lib/problem-search";

const record = tutoringRecordSchema.parse({
  sourceId: "test",
  organization: "cms",
  contest: "COMC",
  sourceUrl: null,
  sourcePages: [],
  style: [],
  estimated: true,
  images: [],
  visualContext: "",
  visualRequired: false,
  related: [],
  defaultSolutionId: null,
  solutions: [],
});
describe("source tutoring", () => {
  it("prefers one official path without merging alternate approaches", () => {
    const unofficial = {
      id: "blog",
      kind: "unofficial",
      text: "A different construction with a different sequence of steps.",
      url: null,
    };
    const official = {
      id: "key",
      kind: "official",
      text: "Use the official factorization and count the resulting roots.",
      url: "https://example.org/key",
    };
    expect(selectReferenceSolution({ ...record, solutions: [unofficial, official] })).toContain(
      official.text,
    );
    expect(selectReferenceSolution({ ...record, solutions: [unofficial, official] })).not.toContain(
      unofficial.text,
    );
    expect(
      selectReferenceSolution({
        ...record,
        defaultSolutionId: "blog",
        solutions: [unofficial, official],
      }),
    ).toContain(unofficial.text);
  });
  it("does not treat an answer key alone as a worked explanation", () => {
    expect(
      selectReferenceSolution({
        ...record,
        solutions: [{ id: "key", kind: "official", text: "Answer: C", url: null }],
      }),
    ).toBeUndefined();
  });
  it("rejects asset traversal and external image fetches", () => {
    for (const path of ["../secrets", "https://example.org/diagram.svg", "assets/../../key.png"])
      expect(
        tutoringRecordSchema.safeParse({ ...record, images: [{ path, alt: "" }] }).success,
      ).toBe(false);
  });
});
describe("problem search", () => {
  it("defaults to a shared learning pool and rejects unbounded pages", () => {
    expect(problemSearchSchema.parse({}).contest).toBe("");
    expect(problemSearchSchema.safeParse({ page: -1 }).success).toBe(false);
    expect(problemSearchSchema.safeParse({ difficulty: 6 }).success).toBe(false);
  });
  it("treats search terms literally rather than as query operators", () => {
    expect(searchWords("triangles%,answer.eq.1_()")).toEqual(["triangles", "answer", "eq", "1"]);
  });
});
