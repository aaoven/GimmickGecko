import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AnswerChecker } from "@/components/AnswerChecker";
import { MathText } from "@/components/MathText";
import { useAccount } from "@/components/AccountSession";
import { getHints } from "@/lib/hints.functions";
import { saveProblemHelp } from "@/lib/attempts.functions";
import { availableProblemStars } from "@/lib/skills";
import type { Problem } from "@/lib/problems.functions";
import gecko from "@/assets/gecko.png";

export function BankProblemPractice({ problem, hintsUsed, answerRevealed, solved, ready }: {
  problem: Problem; hintsUsed: number; answerRevealed: boolean; solved: boolean; ready: boolean;
}) {
  const { user } = useAccount();
  const queryClient = useQueryClient();
  const fetchHints = useServerFn(getHints);
  const saveHelp = useServerFn(saveProblemHelp);
  const [hints, setHints] = useState<string[] | null>(null);
  const [visibleHints, setVisibleHints] = useState(0);
  const [gimmick, setGimmick] = useState("");
  const [localHints, setLocalHints] = useState(0);
  const [localSolved, setLocalSolved] = useState(false);
  const [revealedAnswer, setRevealedAnswer] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [busy, setBusy] = useState(false);
  const used = Math.max(hintsUsed, localHints);
  const shown = answerRevealed || revealedAnswer;
  const completed = solved || localSolved;
  const stars = availableProblemStars(problem.difficulty, used, completed, shown);

  async function reveal(answer = false) {
    if (busy || !ready) return;
    if (answer && showAnswer) { setShowAnswer(false); return; }
    setBusy(true);
    try {
      let nextHints = hints;
      if (!answer && !nextHints) {
        const response = await fetchHints({ data: { problem: problem.statement, track: false } });
        if (!response.ok) { toast.error(response.error); return; }
        nextHints = response.result.hints;
        setHints(nextHints);
        setGimmick(response.result.gimmick);
        return;
      }
      const nextVisible = Math.min(visibleHints + 1, nextHints?.length ?? visibleHints);
      const next = answer ? used : Math.max(used, nextVisible);
      if (user) await saveHelp({ data: { problemId: problem.id, hints: next, answerRevealed: answer } });
      if (answer) { setRevealedAnswer(true); setShowAnswer(true); }
      else { setLocalHints(next); setVisibleHints(nextVisible); }
      if (user) await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["bank-progress"] }),
        queryClient.invalidateQueries({ queryKey: ["attempts"] }),
        queryClient.invalidateQueries({ queryKey: ["recommendations"] }),
      ]);
    } catch { toast.error("Could not load or save your help. Please try again."); }
    finally { setBusy(false); }
  }

  return <>
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm" disabled={busy || !ready || !!hints && visibleHints >= hints.length} onClick={() => void reveal()} aria-controls={`hints-${problem.id}`} aria-expanded={!!hints}>
        {busy ? <Loader2 className="animate-spin" /> : null}
        {!hints ? "Get gecko hints" : visibleHints >= hints.length ? "All hints shown" : `Next hint (${visibleHints + 1}/${hints.length})`}
      </Button>
      <Button size="sm" variant="secondary" disabled={busy || !ready} onClick={() => void reveal(true)} aria-expanded={showAnswer}>
        {showAnswer ? "Hide answer" : "Reveal answer"}
      </Button>
      <div role="status" aria-live="polite" aria-atomic="true" className="flex min-h-9 items-center gap-2 text-sm text-muted-foreground">
        <Star aria-hidden="true" className="h-5 w-5 shrink-0 fill-accent text-accent" />
        <span>{!ready ? "Loading stars…" : <><strong className="tabular-nums text-accent">{stars}</strong> {stars === 1 ? "star" : "stars"} available{completed ? " · Already solved" : shown ? " · Answer revealed" : ""}</>}</span>
      </div>
    </div>
    {hints && <div id={`hints-${problem.id}`} className="mt-5 border-t border-border pt-4">
      <div className="mb-3 flex items-center gap-3"><img src={gecko} alt="" className="pixelated h-12 w-12" /><h2 className="font-pixel text-[10px] text-primary">Gecko hints</h2></div>
      <div className="mb-4 text-highlight-foreground"><div className="mb-1 font-pixel text-[9px] text-accent">The gimmick</div><p className="break-words text-lg"><MathText text={gimmick} /></p></div>
      <ol aria-live="polite" className="space-y-3">{hints.slice(0, visibleHints).map((hint, i) => <li key={i} className="border-l-2 border-primary pl-3"><div className="mb-1 font-pixel text-[9px] text-primary">Hint {i + 1}</div><p className="break-words text-lg"><MathText text={hint} /></p></li>)}</ol>
    </div>}
    {showAnswer && <p className="mt-4 break-words text-lg text-primary" role="status">Answer: <MathText text={problem.answer ?? "Unavailable"} /></p>}
    {!showAnswer && <AnswerChecker answer={problem.answer} problemId={problem.id} disabled={!ready || busy} onChecked={(correct) => { if (correct) setLocalSolved(true); }} />}
  </>;
}