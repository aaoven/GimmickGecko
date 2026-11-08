import katex from "katex";
import "katex/dist/katex.min.css";
import { splitMath } from "@/lib/math-text";

/** Typesets contest math while retaining prose, line breaks and literal currency. */
export function MathText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={`whitespace-pre-wrap ${className ?? ""}`}>
      {splitMath(text).map((segment, i) =>
        segment.math ? (
          <span
            key={i}
            className={segment.display ? "block overflow-x-auto" : undefined}
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(segment.text, {
                throwOnError: false,
                displayMode: segment.display ?? false,
                trust: false,
                maxExpand: 1000,
              }),
            }}
          />
        ) : (
          <span key={i}>{segment.text}</span>
        ),
      )}
    </span>
  );
}
