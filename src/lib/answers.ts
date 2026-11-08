/** Normalize presentation without merging tuple entries or separated digits. */
export function normalizeAnswer(value: string): string {
  const text = value.trim().toLowerCase().replace(/−/g, "-");
  if (/^[+-]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(text)) return text.replace(/,/g, "");
  return text;
}

type Rational = { n: bigint; d: bigint };

function decimal(value: string): Rational | null {
  value = value.replace(/^([+-]?)\./, (_match, sign: string) => `${sign}0.`);
  const match = /^([+-]?)(\d+)(?:\.(\d*))?(?:e([+-]?\d+))?$/i.exec(value);
  if (!match || value.length > 200) return null;
  const exponent = Number(match[4] ?? 0) - (match[3]?.length ?? 0);
  if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > 1000) return null;
  const digits = BigInt(match[2] + (match[3] ?? "")) * (match[1] === "-" ? -1n : 1n);
  return exponent < 0
    ? { n: digits, d: 10n ** BigInt(-exponent) }
    : { n: digits * 10n ** BigInt(exponent), d: 1n };
}

function rational(raw: string): Rational | null {
  let value = normalizeAnswer(raw)
    .replace(/^\\\(([\s\S]*)\\\)$/, "$1")
    .trim();
  const mixed = /^([+-]?\d+)\s+(\d+)\/(\d+)$/.exec(value);
  if (mixed) {
    const denominator = BigInt(mixed[3]!);
    if (!denominator) return null;
    const sign = mixed[1]!.startsWith("-") ? -1n : 1n;
    return { n: BigInt(mixed[1]!) * denominator + sign * BigInt(mixed[2]!), d: denominator };
  }
  // A PDF's stacked fraction must never become a concatenated integer.
  if (/\d\s+\d/.test(value)) return null;
  value = value.replace(/\s+/g, "").replace(/^\\[dt]?frac\{([+-]?\d+)\}\{([+-]?\d+)\}$/, "$1/$2");
  const fraction = /^([^/]+)\/([^/]+)$/.exec(value);
  if (fraction) {
    const a = decimal(fraction[1]!);
    const b = decimal(fraction[2]!);
    return a && b && b.n !== 0n ? { n: a.n * b.d, d: a.d * b.n } : null;
  }
  return decimal(value);
}

function equalNumbers(a: string, b: string): boolean {
  const left = rational(a);
  const right = rational(b);
  return !!left && !!right && left.n * right.d === right.n * left.d;
}

/** Exact comparison for choices, rational numbers, percentages and ordered tuples. */
export function isCorrectAnswer(given: string, expected: string): boolean {
  const g = normalizeAnswer(given);
  const e = normalizeAnswer(expected);
  if (!g || !e || g.length > 1000 || e.length > 1000) return false;
  const choice = /^(?:([a-f])|\(([a-f])\))$/i;
  const ec = choice.exec(e);
  if (ec) {
    const gc = choice.exec(g);
    return !!gc && (gc[1] ?? gc[2]) === (ec[1] ?? ec[2]);
  }
  if (e.startsWith("(") && e.endsWith(")") && e.includes(",")) {
    if (!g.startsWith("(") || !g.endsWith(")")) return false;
    const left = g.slice(1, -1).split(",");
    const right = e.slice(1, -1).split(",");
    return (
      left.length === right.length && left.every((entry, i) => isCorrectAnswer(entry, right[i]!))
    );
  }
  if (e.endsWith("%")) return equalNumbers(g.replace(/%$/, ""), e.slice(0, -1));
  if (g.endsWith("%")) {
    const percent = rational(g.slice(0, -1));
    const number = rational(e);
    return !!percent && !!number && percent.n * number.d === number.n * percent.d * 100n;
  }
  if (/\d\s+\d/.test(g) || /\d\s+\d/.test(e)) return equalNumbers(g, e);
  if (/^(?:[+-]?infinity|nan)$/i.test(g) || /^(?:[+-]?infinity|nan)$/i.test(e)) return false;
  const numericSyntax = (value: string) =>
    /^[+\-\d.e/]+$/i.test(value) || /^\\[dt]?frac\{[+-]?\d+\}\{[+-]?\d+\}$/.test(value);
  if (rational(g) || rational(e) || numericSyntax(g) || numericSyntax(e)) return equalNumbers(g, e);
  return g.replace(/\s+/g, "") === e.replace(/\s+/g, "");
}
