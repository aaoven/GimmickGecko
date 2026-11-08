import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { planRows } from "./contest-data.mjs";

const candidate = {
  id: "3d5637a1-a72a-5fd8-8fbc-dff486ae6807",
  contest: "Fermat",
  year: 2026,
  problem_number: 1,
  statement: "Find $x$.",
  concepts: ["Algebra"],
  difficulty: 1,
  answer: "C",
};
const old = {
  ...candidate,
  id: "ce0fb690-d75b-50e2-952b-a56fcd1a79f5",
  statement: "Find \\(x\\).",
  answer: "D",
};
describe("non-destructive contest import planning", () => {
  it("preserves existing IDs and answer keys without overwriting rows", () => {
    const plan = planRows([candidate], [old]);
    assert.equal(plan.mapping[candidate.id], old.id);
    assert.equal(plan.inserts.length, 0);
    assert.equal(old.answer, "D");
  });
  it("keeps distinct contest versions even when the problem number agrees", () => {
    const plan = planRows([candidate], [{ ...old, statement: "A completely different problem." }]);
    assert.equal(plan.inserts.length, 1);
  });
  it("stops ambiguous matches instead of reassigning user history", () => {
    const plan = planRows(
      [candidate],
      [old, { ...old, id: "7c2f80dc-cc2b-583c-9dcc-ca3219185828" }],
    );
    assert.deepEqual(plan.conflicts, [candidate.id]);
    assert.equal(plan.inserts.length, 0);
  });
  it("rejects duplicate UUIDs and unexpected existing UUID collisions", () => {
    assert.throws(() => planRows([candidate, candidate], []), /Duplicate/);
    assert.throws(() => planRows([candidate], [{ ...candidate, statement: "Other" }]), /collision/);
  });
});
