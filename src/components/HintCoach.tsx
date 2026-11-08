import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ImagePlus, Loader2, Square, Star, Volume2, VolumeX, X } from "lucide-react";
import { streamSpeech } from "@/lib/stream-speech";
import { toast } from "sonner";
import geckoImg from "@/assets/gecko.png";
import { Button, buttonVariants } from "@/components/ui/button";
import { AnswerChecker } from "@/components/AnswerChecker";
import { useAccount } from "@/components/AccountSession";
import { getBankProgress, saveProblemHelp } from "@/lib/attempts.functions";
import { getHints, saveCustomHelp } from "@/lib/hints.functions";
import type { HintResult } from "@/lib/hints.server";
import { starsForAnswer } from "@/lib/skills";

export function HintCoach({ initialProblem = "", problemId }: { initialProblem?: string; problemId?: string | undefined }) {
  const { user } = useAccount();
  const saveHelp = useServerFn(saveProblemHelp);
  const [savingHelp, setSavingHelp] = useState(false);
  const fetchHints = useServerFn(getHints);
  const [problem, setProblem] = useState(initialProblem);
  const [image, setImage] = useState<string | undefined>();
  const bankProblemId = problem === initialProblem && !image ? problemId : undefined;
  const loadProgress = useServerFn(getBankProgress);
  const progress = useQuery({ queryKey: ["bank-progress", user?.id], queryFn: () => loadProgress(), enabled: !!user && !!bankProblemId });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HintResult | null>(null);
  const [customId, setCustomId] = useState<string | null>(null);
  const saveCustom = useServerFn(saveCustomHelp);
  const [revealed, setRevealed] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [answerWasRevealed, setAnswerWasRevealed] = useState(false);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [solved, setSolved] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const speechCtrl = useRef<AbortController | null>(null);

  useEffect(() => () => speechCtrl.current?.abort(), []);

  function stopSpeaking() {
    speechCtrl.current?.abort();
    speechCtrl.current = null;
    setSpeaking(false);
  }

  async function speak(text: string) {
    stopSpeaking();
    const ctrl = new AbortController();
    speechCtrl.current = ctrl;
    setSpeaking(true);
    try {
      await streamSpeech("/api/speak", text, ctrl.signal);
    } catch (e) {
      if (!ctrl.signal.aborted) {
        console.error(e);
        toast.error("The gecko lost its voice. Try again.");
      }
    } finally {
      if (speechCtrl.current === ctrl) {
        speechCtrl.current = null;
        setSpeaking(false);
      }
    }
  }

  async function revealHelp(answer = false) {
    if (!result || savingHelp) return;
    if (answer && showAnswer) { setShowAnswer(false); return; }
    const next = answer ? revealed : revealed + 1;
    setSavingHelp(true);
    try {
      if (bankProblemId && user) await saveHelp({ data: { problemId: bankProblemId, hints: next, answerRevealed: answer } });
      else if (customId && user) await saveCustom({ data: { id: customId, hints: next, answerRevealed: answer } });
      if (answer) { setShowAnswer(true); setAnswerWasRevealed(true); }
      else {
        setRevealed(next);
        if (voiceOn) void speak(`Hint ${next}. ${result.hints[revealed]}`);
      }
    } catch { toast.error("Your hint usage could not be saved. Try again."); }
    finally { setSavingHelp(false); }
  }

  function onFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image must be under 4 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function submit() {
    if (!problem.trim() && !image) {
      toast.error("Paste a problem or upload a picture first.");
      return;
    }
    setLoading(true);
    setResult(null);
    setRevealed(0);
    setShowAnswer(false);
    setAnswerWasRevealed(false);
    setIncorrectAnswers(0);
    setSolved(false);
    setCustomId(null);
    try {
      const res = await fetchHints({ data: { problem, imageDataUrl: image, track: !!user && !bankProblemId } });
      if (!res.ok) toast.error(res.error);
      else { setResult(res.result); setCustomId(res.customId); }
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const notMath = result?.isMathProblem === false;

  const speech = loading
    ? "Hmm… let me scale this problem…"
    : !result
      ? "Feed me a contest problem! I'll drop hints one at a time."
      : notMath
        ? "That's not a math problem, I can only teach math!"
        : revealed === 0
          ? `A ${result.topic} problem! Here's the gimmick. Want a hint?`
          : revealed < result.hints.length
            ? "Keep going — try it before the next hint!"
            : "That's all my hints. You've got this!";

  const bankHelp = progress.data?.help.find((row) => row.problem_id === bankProblemId);
  const availableStars = result ? starsForAnswer(result.difficulty, Math.max(revealed, bankHelp?.hints_revealed ?? 0), !answerWasRevealed && !bankHelp?.answer_revealed && !solved && !(bankProblemId && progress.data?.solved.includes(bankProblemId)), Math.max(incorrectAnswers, bankProblemId ? progress.data?.incorrect[bankProblemId] ?? 0 : 0)) : 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <section className="space-y-6">
        <div className="bg-card p-5 pixel-box-lg">
          <label htmlFor="problem" className="mb-3 block font-pixel text-[10px] uppercase text-muted-foreground">
            Your problem
          </label>
          <textarea
            id="problem"
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            rows={6}
            placeholder="e.g. Find the largest positive integer n for which n³ + 100 is divisible by n + 10."
            className="w-full resize-y bg-input p-3 font-mono text-xl leading-snug text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {image && (
            <div className="relative mt-3 inline-block">
              <img src={image} alt="Uploaded problem" className="max-h-48 border-3 border-border" />
              <button
                onClick={() => setImage(undefined)}
                className="absolute -right-2 -top-2 bg-destructive p-1 text-destructive-foreground"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <label className={buttonVariants({ variant: "secondary", className: "cursor-pointer" })}>
              <ImagePlus /> Upload image
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
            <Button onClick={submit} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : null}
              {loading ? "Thinking" : "Ask the gecko"}
            </Button>
          </div>
        </div>

        {notMath && (
          <div role="status" className="bg-card p-5 pixel-box">
            <p className="text-lg">That's not a math problem, I can only teach math! Paste a contest problem or upload a photo of one.</p>
          </div>
        )}

        {result && !notMath && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-secondary px-2 py-1 font-pixel text-[9px] uppercase" aria-label={`Difficulty ${result.difficulty} out of 5 stars`}>
                <span className="text-accent">{"★".repeat(result.difficulty)}</span>
                <span className="text-muted-foreground">{"★".repeat(5 - result.difficulty)}</span>
              </span>
              {result.concepts.map((c) => (
                <span key={c} className="bg-accent px-2 py-1 font-pixel text-[9px] uppercase text-accent-foreground">
                  {c}
                </span>
              ))}
            </div>
            <div className="bg-highlight p-4 text-highlight-foreground pixel-box">
              <div className="mb-1 font-pixel text-[10px] uppercase">★ The gimmick</div>
              <p className="text-lg">{result.gimmick}</p>
            </div>
            <ol className="space-y-3">
              {result.hints.slice(0, revealed).map((h, i) => (
                <li key={i} className="animate-in fade-in slide-in-from-left-2 bg-card p-4 pixel-box">
                  <div className="mb-1 font-pixel text-[10px] uppercase text-primary">Hint {i + 1}</div>
                  <p className="text-lg">{h}</p>
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap items-center gap-3">
              {revealed < result.hints.length && (
                <Button onClick={() => void revealHelp()} disabled={savingHelp}>
                  Next hint ({revealed + 1}/{result.hints.length})
                </Button>
              )}
              <Button variant="accent" onClick={() => void revealHelp(true)} disabled={savingHelp}>
                {showAnswer ? "Hide answer" : "Reveal answer"}
              </Button>
              <div role="status" aria-live="polite" aria-atomic="true" className="flex min-h-11 items-center gap-2 text-sm text-muted-foreground">
                <Star aria-hidden="true" className="h-5 w-5 shrink-0 fill-accent text-accent" />
                <span><strong className="tabular-nums text-accent">{availableStars}</strong> {availableStars === 1 ? "star" : "stars"} for a correct answer</span>
              </div>
            </div>
            {showAnswer && (
              <div className="inline-block bg-primary px-4 py-3 font-pixel text-sm text-primary-foreground pixel-box">
                Answer: {result.answer}
              </div>
            )}
            {!showAnswer && revealed < result.hints.length && <AnswerChecker answer={result.answer} problemId={bankProblemId} customId={bankProblemId ? undefined : customId} onChecked={(correct) => { if (correct) setSolved(true); else setIncorrectAnswers((count) => count + 1); }} />}
          </div>
        )}
      </section>

      <aside className="order-first lg:order-none">
        <div className="sticky top-6 flex flex-col items-center">
          <div className="relative mb-4 w-full bg-card p-4 pixel-box">
            <p className="font-mono text-2xl leading-tight">
              {speech}
              <span className="animate-caret">▌</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={speaking ? "accent" : "secondary"}
                onClick={() => {
                  if (speaking) return stopSpeaking();
                  const latest = result && !notMath && revealed > 0 ? ` Hint ${revealed}. ${result.hints[revealed - 1]}` : "";
                  const gimmick = result && !notMath && revealed === 0 ? ` The gimmick: ${result.gimmick}` : "";
                  void speak(speech + gimmick + latest);
                }}
                aria-label={speaking ? "Stop speaking" : "Read aloud"}
              >
                {speaking ? <Square /> : <Volume2 />}
                {speaking ? "Stop" : "Read aloud"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (voiceOn) stopSpeaking();
                  setVoiceOn((v) => !v);
                }}
                aria-pressed={voiceOn}
                aria-label="Auto-read hints"
              >
                {voiceOn ? <Volume2 /> : <VolumeX />}
                Auto {voiceOn ? "on" : "off"}
              </Button>
            </div>
            <div className="absolute -bottom-3 left-1/2 h-0 w-0 -translate-x-1/2 border-x-[12px] border-t-[12px] border-x-transparent border-t-border" />
          </div>
          <img
            src={geckoImg}
            alt="Gimmick Gecko mascot"
            width={1024}
            height={1024}
            className={`pixelated w-56 ${loading ? "animate-gecko" : ""}`}
          />
        </div>
      </aside>
    </div>
  );
}
