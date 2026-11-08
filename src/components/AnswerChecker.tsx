import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { isCorrectAnswer } from "@/lib/answers";
import { recordAttempt } from "@/lib/attempts.functions";
import { checkCustomAnswer } from "@/lib/hints.functions";
import { useAccount } from "@/components/AccountSession";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MathKeyboard } from "@/components/MathKeyboard";
import { MathText } from "@/components/MathText";

export function AnswerChecker({ answer, problemId, customId, onChecked, disabled = false }: { answer: string | null; problemId?: string | undefined; customId?: string | null | undefined; onChecked?: (correct: boolean, earnedStars?: number) => void; disabled?: boolean }) {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [stars, setStars] = useState<{ earned: number; possible: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAccount();
  const queryClient = useQueryClient();
  const record = useServerFn(recordAttempt);
  const checkCustom = useServerFn(checkCustomAnswer);
  const inputRef = useRef<HTMLInputElement>(null);

  /** Inserts a keyboard snippet at the cursor, leaving the cursor inside any placeholder braces. */
  function insertSnippet(snippet: string, cursorBack: number) {
    const input = inputRef.current;
    const start = input?.selectionStart ?? value.length;
    const end = input?.selectionEnd ?? start;
    setValue(value.slice(0, start) + snippet + value.slice(end));
    setResult(null);
    setStars(null);
    const position = start + snippet.length - cursorBack;
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(position, position);
    });
  }

  if (answer == null) return null;
  return (
    <form
      className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy || disabled || !value.trim()) return;
        setError("");
        const correct = isCorrectAnswer(value, answer);
        if ((problemId || customId) && user) {
          setBusy(true);
          try {
            const saved = problemId
              ? await record({ data: { problemId, answer: value } })
              : customId ? await checkCustom({ data: { id: customId, answer: value } }) : null;
            if (!saved) return;
            setResult(saved.correct ? "correct" : "wrong");
            setStars({ earned: saved.earnedStars, possible: saved.possibleStars });
            onChecked?.(saved.correct, saved.earnedStars);
            await queryClient.invalidateQueries({ queryKey: ["bank-progress"] });
            await queryClient.invalidateQueries({ queryKey: ["attempts"] });
            await queryClient.invalidateQueries({ queryKey: ["recommendations"] });
          } catch { setError("Your answer could not be saved. Please try again."); }
          finally { setBusy(false); }
        } else { setResult(correct ? "correct" : "wrong"); onChecked?.(correct); }
      }}
    >
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setResult(null);
          setStars(null);
        }}
        placeholder="Your answer"
        aria-label="Your answer"
        className="h-9 w-40 bg-input sm:w-56"
      />
      <Button type="submit" size="sm" variant="secondary" disabled={disabled || busy || !value.trim()}>
        {busy ? "Saving…" : "Check answer"}
      </Button>
      <MathKeyboard onInsert={insertSnippet} disabled={disabled || busy} />
      {value.trim() && (
        <div aria-live="polite" className="flex w-full items-baseline gap-2 text-lg text-muted-foreground">
          <span className="shrink-0 font-pixel text-[9px] uppercase">Preview</span>
          <MathText text={`$${value.replace(/\$/g, "")}$`} />
        </div>
      )}
      {result === "correct" && (
        <p role="status" className="font-pixel text-[10px] uppercase text-primary">
          Correct! {stars && `${stars.earned}/${stars.possible} stars`}
        </p>
      )}
      {error && <p role="alert" className="text-destructive">{error}</p>}
      {result === "wrong" && (
        <p role="status" className="text-destructive">
          Not quite — one available star deducted (minimum 0). Try again.
        </p>
      )}
    </form>
  );
}
