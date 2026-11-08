const STOP = new Set(
  "the a an of to and or in is are for what find if with that this be on as by from it its which then".split(
    " ",
  ),
);
export function problemTokens(text: string): Set<string> {
  return new Set(
    (text.toLowerCase().match(/[a-z]+|\d+(?:\.\d+)?/g) ?? []).filter((word) => !STOP.has(word)),
  );
}

/** Conservative retrieval: numerical disagreement or near ties always abstain. */
export function matchProblem<T extends { statement: string }>(
  text: string,
  candidates: T[],
): T | null {
  const query = problemTokens(text);
  if (query.size < 8) return null;
  const numbersInOrder = (s: string) => (s.match(/\d+(?:\.\d+)?/g) ?? []).join("|");
  const operators = (s: string) =>
    (
      s
        .replace(/\\times|\\cdot|×/g, "*")
        .replace(/\\div|÷/g, "/")
        .replace(/−|–/g, "-")
        .match(/[+\-*=^<>/]/g) ?? []
    ).join("");
  const numbers = numbersInOrder(text);
  const ranked = candidates
    .map((problem) => {
      const tokens = problemTokens(problem.statement);
      const sameNumbers =
        numbersInOrder(problem.statement) === numbers &&
        operators(problem.statement) === operators(text);
      const overlap = [...query].filter((w) => tokens.has(w)).length;
      return { problem, score: sameNumbers ? (2 * overlap) / (query.size + tokens.size) : 0 };
    })
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];
  return best && best.score >= 0.86 && best.score - (ranked[1]?.score ?? 0) >= 0.12
    ? best.problem
    : null;
}
