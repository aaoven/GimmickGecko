import { parse, type MathNode } from "mathjs";

/** Normalizes an answer for comparison: trims, lowercases, drops spaces and commas. */
export function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase().replace(/[\s,]+/g, "");
}

/**
 * Checks a submitted answer against the expected one.
 * Exact match after normalization, or numeric equality so "060" matches "60".
 */
export function isCorrectAnswer(given: string, expected: string): boolean {
  const g = normalizeAnswer(given);
  const e = normalizeAnswer(expected);
  if (!g || !e) return false;
  if (g === e) return true;
  const gn = numericAnswer(given);
  const en = numericAnswer(expected);
  return gn !== null && en !== null && Math.abs(gn - en) <= 1e-12 * Math.max(1, Math.abs(gn), Math.abs(en));
}

/** Only evaluate bounded numeric expressions, never assignments or arbitrary functions. */
function numericAnswer(value: string): number | null {
  if (value.length > 1000) return null;
  const expression = value.toLowerCase().replace(/,/g, "").replace(/−/g, "-")
    .replace(/×/g, "*").replace(/÷/g, "/")
    .replace(/\\sqrt\{([^{}]+)\}/g, "sqrt($1)")
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "(($1)/($2))")
    .replace(/\b(?:square\s+root\s+of|root|sqrt)\s*(\d+(?:\.\d+)?)/g, "sqrt($1)")
    .replace(/√\s*(\d+(?:\.\d+)?)/g, "sqrt($1)").replace(/√\s*\(/g, "sqrt(")
    .replace(/\broot\s*\(/g, "sqrt(");
  try {
    const node = parse(expression);
    let count = 0;
    let valid = true;
    node.traverse((child: MathNode) => {
      count++;
      if (count > 100) valid = false;
      if (child.type === "ConstantNode" || child.type === "ParenthesisNode") return;
      if (child.type === "SymbolNode" && ["sqrt", "abs", "pi", "e"].includes(child.toString())) return;
      if (child.type === "OperatorNode" && ["+", "-", "*", "/", "^"].includes((child as MathNode & { op: string }).op)) return;
      if (child.type === "FunctionNode" && /^(sqrt|abs)\(/.test(child.toString())) return;
      valid = false;
    });
    if (!valid) return null;
    const result: unknown = node.compile().evaluate();
    return typeof result === "number" && Number.isFinite(result) ? result : null;
  } catch { return null; }
}
