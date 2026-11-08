import { useState } from "react";
import { isCorrectAnswer } from "@/lib/answers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AnswerChecker({ answer }: { answer: string | null }) {
  const [value, setValue] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  if (answer == null) return null;
  return (
    <form
      className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4"
      onSubmit={(e) => {
        e.preventDefault();
        setResult(isCorrectAnswer(value, answer) ? "correct" : "wrong");
      }}
    >
      <Input
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setResult(null);
        }}
        placeholder="Your answer"
        aria-label="Your answer"
        className="h-9 w-40 bg-input"
      />
      <Button type="submit" size="sm" variant="secondary">
        Check answer
      </Button>
      {result === "correct" && (
        <p role="status" className="font-pixel text-[10px] uppercase text-primary">
          Correct!
        </p>
      )}
      {result === "wrong" && (
        <p role="status" className="text-destructive">
          Not quite — try again, or ask the gecko for a hint.
        </p>
      )}
    </form>
  );
}
