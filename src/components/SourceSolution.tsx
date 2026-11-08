import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getSourceSolution } from "@/lib/problems.functions";
import { MathText } from "./MathText";
import { Button } from "./ui/button";

/** Loaded only after the learner explicitly reveals the answer and requests the worked path. */
export function SourceSolution({ problemId }: { problemId: string }) {
  const fetchSolution = useServerFn(getSourceSolution);
  const [solution, setSolution] = useState<{
    text: string;
    kind: string;
    url: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  if (solution)
    return (
      <section className="space-y-3 bg-card p-5 pixel-box">
        <h3 className="font-pixel text-xs text-primary">
          {solution.kind === "official" ? "Official source solution" : "Source solution"}
        </h3>
        <MathText text={solution.text} className="block max-h-[36rem] overflow-auto text-lg" />
        {solution.url && (
          <a
            href={solution.url}
            target="_blank"
            rel="noreferrer"
            className="block text-sm text-primary underline"
          >
            Read the solution at its source, including any diagrams
          </a>
        )}
      </section>
    );
  return (
    <div className="space-y-2">
      <Button
        variant="secondary"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          setMessage("");
          try {
            const source = await fetchSolution({ data: { id: problemId } });
            if (source) setSolution(source);
            else setMessage("No worked source solution is available for this question yet.");
          } catch {
            setMessage("Couldn't load the source solution. Try again.");
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading ? "Loading source…" : "Read worked source solution"}
      </Button>
      {message && (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  );
}
