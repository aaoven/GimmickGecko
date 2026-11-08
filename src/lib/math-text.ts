export interface MathSegment {
  math: boolean;
  text: string;
  display?: boolean;
}

/**
 * Splits text into prose and $...$ math segments.
 * An unclosed $ stays part of the surrounding prose.
 */
export function splitMath(text: string): MathSegment[] {
  const result: MathSegment[] = [];
  let prose = "";
  const flush = () => {
    if (prose) result.push({ math: false, text: prose });
    prose = "";
  };
  for (let i = 0; i < text.length;) {
    if (text.startsWith("\\$", i)) {
      prose += "$";
      i += 2;
      continue;
    }
    const opener = ["\\(", "\\[", "$$", "$"].find((token) => text.startsWith(token, i));
    if (!opener) {
      prose += text[i++];
      continue;
    }
    const closer = opener === "\\(" ? "\\)" : opener === "\\[" ? "\\]" : opener;
    let end = text.indexOf(closer, i + opener.length);
    while (end !== -1 && text[end - 1] === "\\" && text[end - 2] !== "\\")
      end = text.indexOf(closer, end + closer.length);
    const content = end === -1 ? "" : text.slice(i + opener.length, end);
    // A second price is not a closing math delimiter: "$20 and $5".
    const currency =
      opener === "$" &&
      /^\d/.test(content) &&
      (/\d/.test(text[end + 1] ?? "") || /^\d[\d,.]*(?:\s+[A-Za-z]{2,})/.test(content));
    if (end === -1 || !content.trim() || currency) {
      prose += text[i++];
      continue;
    }
    flush();
    const display = opener === "$$" || opener === "\\[";
    result.push({ math: true, text: content, ...(display ? { display: true } : {}) });
    i = end + closer.length;
  }
  flush();
  return result;
}

const SUPERSCRIPTS: Record<string, string> = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
};

/** One level of nested braces, e.g. \dfrac{n}{x_{n-1}}. */
const BRACED = "((?:[^{}]|\\{[^{}]*\\})*)";

function toSuperscript(digits: string): string {
  return [...digits].map((d) => SUPERSCRIPTS[d] ?? d).join("");
}

/**
 * Turns $...$ math back into readable plain text for the gecko's input box
 * and voice: fractions become (a)/(b), roots use √, commands like \log lose
 * their backslash, and subscript notation like x_1 is kept as-is.
 */
export function stripMathDelimiters(text: string): string {
  let s = splitMath(text)
    .map((segment) => segment.text)
    .join("");
  const fraction = new RegExp(`\\\\d?frac\\{${BRACED}\\}\\{${BRACED}\\}`);
  while (fraction.test(s)) s = s.replace(fraction, "($1)/($2)");
  s = s.replace(
    new RegExp(`\\\\sqrt\\[(\\d+)\\]\\{${BRACED}\\}`, "g"),
    (_m, n: string, x: string) => `${toSuperscript(n)}√(${x})`,
  );
  s = s.replace(new RegExp(`\\\\sqrt\\{${BRACED}\\}`, "g"), "√($1)");
  s = s.replace(/\\(cdots|ldots|dots)/g, "…");
  s = s.replace(/\\le\b/g, "≤").replace(/\\ge\b/g, "≥");
  s = s.replace(/\\([a-zA-Z]+)/g, "$1");
  s = s.replace(/_\{([^}]*)\}/g, (_m, sub: string) =>
    /^[A-Za-z0-9]+$/.test(sub) ? `_${sub}` : `_(${sub})`,
  );
  s = s.replace(/[{}]/g, "");
  return s;
}
