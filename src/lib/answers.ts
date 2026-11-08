import { parse, type MathNode } from "mathjs";

/** Normalizes an answer for comparison: trims, lowercases, drops spaces and commas. */
export function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase().replace(/[\s,]+/g, "");
}

export interface AnswerParts {
  /** Multiple-choice letter (A–E), uppercased, when the answer names one. */
  letter: string | null;
  /** The numerical/expression part left after removing the letter, if any. */
  value: string | null;
}

const PAREN_LETTER = /\(\s*([A-Ea-e])\s*\)/;
const STANDALONE_LETTER = /^([A-Ea-e])\.?$/;
const LEADING_LETTER = /^([A-Ea-e])(?:[).:,]|\s)\s*/;
const TRAILING_LETTER = /\s+\(?([A-Ea-e])\)?\.?$/;

/**
 * Splits an answer into its multiple-choice letter and numerical value so each
 * part is compared separately: "22/23 (D)" → { letter: "D", value: "22/23" },
 * "d" → { letter: "D", value: null }, "60" → { letter: null, value: "60" }.
 */
export function splitAnswerParts(raw: string): AnswerParts {
  let text = raw.trim();
  if (!text) return { letter: null, value: null };
  let letter: string | null = null;

  const paren = text.match(PAREN_LETTER);
  if (paren) {
    letter = paren[1]!.toUpperCase();
    text = text.replace(PAREN_LETTER, " ").trim();
  } else {
    const standalone = text.match(STANDALONE_LETTER);
    const leading = standalone ? null : text.match(LEADING_LETTER);
    const trailing = standalone || leading ? null : text.match(TRAILING_LETTER);
    const match = standalone ?? leading ?? trailing;
    if (match) {
      letter = match[1]!.toUpperCase();
      text = text.replace(match[0], " ").trim();
    }
  }
  return { letter, value: text || null };
}

/** Value equivalence: normalized text match, or evaluated math equality. */
function valuesMatch(given: string | null, expected: string | null): boolean {
  if (!given || !expected) return false;
  const g = normalizeAnswer(given);
  const e = normalizeAnswer(expected);
  if (g && g === e) return true;
  const gn = numericAnswer(given);
  const en = numericAnswer(expected);
  return gn !== null && en !== null && Math.abs(gn - en) <= 1e-12 * Math.max(1, Math.abs(gn), Math.abs(en));
}

/**
 * Checks a submitted answer against the expected one. Multiple-choice answers
 * such as "22/23 (D)" accept the letter ("D"/"d"), the value ("22/23"), or
 * both together; a wrong letter or non-equivalent value is rejected. Plain
 * answers match by normalized text or evaluated numeric equivalence.
 */
export function isCorrectAnswer(given: string, expected: string): boolean {
  const g = normalizeAnswer(given);
  const e = normalizeAnswer(expected);
  if (!g || !e) return false;
  if (g === e) return true;

  const gp = splitAnswerParts(given);
  const ep = splitAnswerParts(expected);

  if (gp.letter) {
    // Letter-only submission: it must match the expected letter.
    if (!gp.value) return ep.letter !== null && gp.letter === ep.letter;
    // Letter + value: a conflicting expected letter rejects it outright.
    if (ep.letter && gp.letter !== ep.letter) return false;
    return valuesMatch(gp.value, ep.value);
  }

  // Value-only submission: correct when the values are equivalent, even when
  // the expected answer also names a multiple-choice letter.
  return valuesMatch(gp.value, ep.value);
}

/** Only evaluate bounded numeric expressions, never assignments or arbitrary functions. */
function numericAnswer(value: string): number | null {
  if (value.length > 1000) return null;
  const expression = value.toLowerCase().replace(/,/g, "").replace(/−/g, "-")
    .replace(/×/g, "*").replace(/÷/g, "/")
    .replace(/\\sqrt\{([^{}]+)\}/g, "sqrt($1)")
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "(($1)/($2))")
    .replace(/\\left\|([^{}]+?)\\right\|/g, "abs($1)")
    .replace(/\\left\(/g, "(").replace(/\\right\)/g, ")")
    .replace(/\\times|\\cdot/g, "*").replace(/\\div/g, "/")
    .replace(/\\pi/g, "pi")
    .replace(/\^\{?\\circ\}?/g, "").replace(/°/g, "")
    .replace(/\\[,;! ]/g, "")
    .replace(/\^\{([^{}]+)\}/g, "^($1)")
    .replace(/\{([^{}]*)\}/g, "($1)")
    .replace(/(\d)\s*(?:root|sqrt)\s*\(\s*/g, "$1*sqrt(")
    .replace(/(\d)\s*(?:root|sqrt)\s*(\d+(?:\.\d+)?)/g, "$1*sqrt($2)")
    .replace(/(\d)\s*√\s*\(\s*/g, "$1*sqrt(")
    .replace(/(\d)\s*√\s*(\d+(?:\.\d+)?)/g, "$1*sqrt($2)")
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
