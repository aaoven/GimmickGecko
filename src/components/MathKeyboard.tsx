import { useId, useState } from "react";
import { Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MathText } from "@/components/MathText";

type Symbol = { label: string; aria: string; snippet: string; cursorBack?: number };

const SYMBOLS: Symbol[] = [
  { label: "$\\sqrt{x}$", aria: "Insert square root", snippet: "\\sqrt{}", cursorBack: 1 },
  { label: "$\\frac{a}{b}$", aria: "Insert fraction", snippet: "\\frac{}{}", cursorBack: 3 },
  { label: "$x^{2}$", aria: "Insert exponent", snippet: "^{}", cursorBack: 1 },
  { label: "$x_{i}$", aria: "Insert subscript", snippet: "_{}", cursorBack: 1 },
  { label: "$(\\,)$", aria: "Insert parentheses", snippet: "()", cursorBack: 1 },
  { label: "$\\pi$", aria: "Insert pi", snippet: "\\pi " },
  { label: "$\\theta$", aria: "Insert theta", snippet: "\\theta " },
  { label: "$\\times$", aria: "Insert multiplication", snippet: "\\times " },
  { label: "$\\div$", aria: "Insert division", snippet: "\\div " },
  { label: "$\\pm$", aria: "Insert plus-minus", snippet: "\\pm " },
  { label: "$\\le$", aria: "Insert less than or equal to", snippet: "\\le " },
  { label: "$\\ge$", aria: "Insert greater than or equal to", snippet: "\\ge " },
  { label: "$\\ne$", aria: "Insert not equal to", snippet: "\\ne " },
  { label: "$\\infty$", aria: "Insert infinity", snippet: "\\infty " },
  { label: "$|x|$", aria: "Insert absolute value", snippet: "\\left|\\right|", cursorBack: 7 },
  { label: "$x^\\circ$", aria: "Insert degrees", snippet: "^\\circ " },
  { label: "$\\log$", aria: "Insert logarithm", snippet: "\\log()", cursorBack: 1 },
];

/** Expandable keyboard that inserts math symbols into an answer input. */
export function MathKeyboard({ onInsert, disabled = false }: { onInsert: (snippet: string, cursorBack: number) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Hide math symbols keyboard" : "Show math symbols keyboard"}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
      >
        <Keyboard /> Math
      </Button>
      {open && (
        <div id={panelId} role="group" aria-label="Math symbols" className="w-full bg-card p-3 pixel-box">
          <div className="flex flex-wrap gap-2">
            {SYMBOLS.map((s) => (
              <button
                key={s.aria}
                type="button"
                aria-label={s.aria}
                disabled={disabled}
                onClick={() => onInsert(s.snippet, s.cursorBack ?? 0)}
                className="min-h-9 min-w-9 bg-secondary px-2 py-1 hover:brightness-125"
              >
                <MathText text={s.label} />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
