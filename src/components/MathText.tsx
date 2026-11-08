import katex from "katex";
import "katex/dist/katex.min.css";
import { splitMath } from "@/lib/math-text";

/** Renders text with $...$ segments as typeset math (subscripts, fractions, superscripts). */
export function MathText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {splitMath(text).map((segment, i) =>
        segment.math ? (
          <span
            key={i}
            dangerouslySetInnerHTML={{ __html: katex.renderToString(segment.text, { throwOnError: false }) }}
          />
        ) : (
          <span key={i}>{segment.text}</span>
        ),
      )}
    </span>
  );
}
