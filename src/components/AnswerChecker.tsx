import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { isCorrectAnswer } from "@/lib/answers";
import { recordAttempt } from "@/lib/attempts.functions";
import { checkCustomAnswer } from "@/lib/hints.functions";
import { useAccount } from "@/components/AccountSession";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AnswerChecker({ answer, problemId, customId }: { answer: string | null; problemId?: string | undefined; customId?: string | null | undefined }) {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [stars, setStars] = useState<{ earned: number; possible: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAccount();
  const queryClient = useQueryClient();
  const record = useServerFn(recordAttempt);
  const checkCustom = useServerFn(checkCustomAnswer);
  if (answer == null) return null;
  return (
    <form
      className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy || !value.trim()) return;
        setError("");
        const correct = isCorrectAnswer(value, answer);
        setResult(correct ? "correct" : "wrong");
        if ((problemId || customId) && user) {
          setBusy(true);
          try {
            const saved = problemId
              ? await record({ data: { problemId, answer: value } })
              : await checkCustom({ data: { id: customId!, answer: value } });
            setResult(saved.correct ? "correct" : "wrong");
            setStars({ earned: saved.earnedStars, possible: saved.possibleStars });
            await queryClient.invalidateQueries({ queryKey: ["attempts"] });
            await queryClient.invalidateQueries({ queryKey: ["recommendations"] });
          } catch { setError("Your answer could not be saved. Please try again."); }
          finally { setBusy(false); }
        }
      }}
    >
      <Input
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setResult(null);
          setStars(null);
        }}
        placeholder="Your answer"
        aria-label="Your answer"
        className="h-9 w-40 bg-input"
      />
      <Button type="submit" size="sm" variant="secondary" disabled={busy || !value.trim()}>
        {busy ? "Saving…" : "Check answer"}
      </Button>
      {result === "correct" && (
        <p role="status" className="font-pixel text-[10px] uppercase text-primary">
          Correct! {stars && `${stars.earned}/${stars.possible} stars`}
        </p>
      )}
      {error && <p role="alert" className="text-destructive">{error}</p>}
      {result === "wrong" && (
        <p role="status" className="text-destructive">
          Not quite — try again, or ask the gecko for a hint.
        </p>
      )}
    </form>
  );
}
