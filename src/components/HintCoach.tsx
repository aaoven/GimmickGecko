import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ImagePlus, Loader2, Square, Volume2, VolumeX, X } from "lucide-react";
import { streamSpeech } from "@/lib/stream-speech";
import { toast } from "sonner";
import geckoImg from "@/assets/gecko.png";
import { Button, buttonVariants } from "@/components/ui/button";
import { AnswerChecker } from "@/components/AnswerChecker";
import { SourceSolution } from "@/components/SourceSolution";
import { useAccount } from "@/components/AccountSession";
import { saveProblemHelp } from "@/lib/attempts.functions";
import { getHints } from "@/lib/hints.functions";
import type { HintResult } from "@/lib/hints.server";

export function HintCoach({
  initialProblem = "",
  problemId,
}: {
  initialProblem?: string;
  problemId?: string | undefined;
}) {
  const { user } = useAccount();
  const saveHelp = useServerFn(saveProblemHelp);
  const [savingHelp, setSavingHelp] = useState(false);
  const fetchHints = useServerFn(getHints);
  const [problem, setProblem] = useState(initialProblem);
  const [image, setImage] = useState<string | undefined>();
  const [matched, setMatched] = useState<{ id: string; label: string } | null>(null);
  const bankProblemId =
    matched?.id ?? (problem === initialProblem && !image ? problemId : undefined);
  const [loading, setLoading] = useState(false);
  const [readingImage, setReadingImage] = useState(false);
  const [result, setResult] = useState<HintResult | null>(null);
  const [canCheckAnswer, setCanCheckAnswer] = useState(true);
  const [grounding, setGrounding] = useState<"source_solution" | "bank_answer" | "generated">(
    "generated",
  );
  const [revealed, setRevealed] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showGimmick, setShowGimmick] = useState(false);
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
    if (!result || savingHelp || (!answer && revealed >= result.hints.length)) return;
    if (answer && showAnswer) {
      setShowAnswer(false);
      return;
    }
    const next = answer ? revealed : revealed + 1;
    setSavingHelp(true);
    try {
      if (bankProblemId && user)
        await saveHelp({ data: { problemId: bankProblemId, hints: next, answerRevealed: answer } });
      if (answer) setShowAnswer(true);
      else {
        setRevealed(next);
        if (voiceOn) void speak(`Hint ${next}. ${result.hints[revealed]}`);
      }
    } catch {
      toast.error("Your hint usage could not be saved. Try again.");
    } finally {
      setSavingHelp(false);
    }
  }

  function clearResult() {
    stopSpeaking();
    setResult(null);
    setRevealed(0);
    setShowAnswer(false);
    setShowGimmick(false);
    setMatched(null);
  }

  function onFile(file?: File) {
    if (!file || readingImage || loading) return;
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
      toast.error("Use a PNG, JPEG, WebP, or GIF image.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image must be under 4 MB.");
      return;
    }
    const reader = new FileReader();
    setReadingImage(true);
    reader.onload = () => {
      clearResult();
      setImage(reader.result as string);
      setReadingImage(false);
    };
    reader.onerror = () => {
      setReadingImage(false);
      toast.error("That image could not be read. Try a different file.");
    };
    reader.readAsDataURL(file);
  }

  async function submit() {
    if (loading || readingImage) return;
    if (!problem.trim() && !image && !bankProblemId) {
      toast.error("Paste a problem or upload a picture first.");
      return;
    }
    setLoading(true);
    clearResult();
    try {
      const res = await fetchHints({
        data: {
          problem: bankProblemId ? "" : problem,
          problemId: bankProblemId,
          imageDataUrl: image,
        },
      });
      if (!res.ok) toast.error(res.error);
      else {
        setResult(res.result);
        setMatched(res.match ?? null);
        setCanCheckAnswer(res.canCheckAnswer ?? true);
        setGrounding(res.grounding ?? "generated");
      }
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const speech = loading
    ? "Hmm… let me scale this problem…"
    : !result
      ? "Feed me a contest problem! I'll drop hints one at a time."
      : revealed === 0
        ? `A ${result.topic} puzzle! Tap the gecko for the hidden trick, or try a hint.`
        : revealed < result.hints.length
          ? "Keep going — try it before the next hint!"
          : "That's all my hints. You've got this!";

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <section className="space-y-6">
        {matched && (
          <p role="status" className="bg-card p-4 pixel-box">
            Found in the bank:{" "}
            <Link to="/ask" search={{ problemId: matched.id }} className="text-primary underline">
              {matched.label}
            </Link>
            . Hints use the saved problem and answer key.
          </p>
        )}
        <div className="bg-card p-5 pixel-box-lg">
          <label
            htmlFor="problem"
            className="mb-3 block font-pixel text-[10px] uppercase text-muted-foreground"
          >
            Your problem
          </label>
          <textarea
            id="problem"
            value={problem}
            onChange={(e) => {
              clearResult();
              setProblem(e.target.value);
            }}
            maxLength={5000}
            disabled={loading}
            rows={6}
            placeholder="e.g. Find the largest positive integer n for which n³ + 100 is divisible by n + 10."
            className="w-full resize-y bg-input p-3 font-mono text-xl leading-snug text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {image && (
            <div className="relative mt-3 inline-block">
              <img src={image} alt="Uploaded problem" className="max-h-48 border-3 border-border" />
              <button
                onClick={() => {
                  clearResult();
                  setImage(undefined);
                }}
                disabled={loading || readingImage}
                className="absolute -right-2 -top-2 bg-destructive p-1 text-destructive-foreground"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <label
              className={buttonVariants({ variant: "secondary", className: "cursor-pointer" })}
            >
              <ImagePlus /> Upload image
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                disabled={loading || readingImage}
                className="hidden"
                onChange={(e) => {
                  onFile(e.target.files?.[0]);
                  e.currentTarget.value = "";
                }}
              />
            </label>
            <Button onClick={submit} disabled={loading || readingImage}>
              {loading ? <Loader2 className="animate-spin" /> : null}
              {loading ? "Thinking" : readingImage ? "Reading image…" : "Ask the gecko"}
            </Button>
          </div>
        </div>

        {result && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {grounding === "source_solution"
                ? "Hints follow a saved source solution."
                : grounding === "bank_answer"
                  ? "Answer checked against the saved key; hint reasoning is AI-generated."
                  : "AI-generated coaching. Check important steps against your source."}
            </p>
            <div className="flex flex-wrap gap-2">
              {result.concepts.map((c) => (
                <span
                  key={c}
                  className="bg-accent px-2 py-1 font-pixel text-[9px] uppercase text-accent-foreground"
                >
                  {c}
                </span>
              ))}
            </div>
            <div className="bg-highlight p-4 text-highlight-foreground pixel-box">
              <button
                type="button"
                className="font-pixel text-[10px] uppercase underline underline-offset-4"
                aria-expanded={showGimmick}
                onClick={() => setShowGimmick((v) => !v)}
              >
                {showGimmick ? "Hide the gimmick" : "★ Reveal the gimmick"}
              </button>
              {showGimmick && <p className="mt-2 text-lg">{result.gimmick}</p>}
            </div>
            <ol className="space-y-3">
              {result.hints.slice(0, revealed).map((h, i) => (
                <li
                  key={i}
                  className="animate-in fade-in slide-in-from-left-2 bg-card p-4 pixel-box"
                >
                  <div className="mb-1 font-pixel text-[10px] uppercase text-primary">
                    Hint {i + 1}
                  </div>
                  <p className="text-lg">{h}</p>
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap gap-3">
              {revealed < result.hints.length && (
                <Button onClick={() => void revealHelp()} disabled={savingHelp}>
                  Next hint ({revealed + 1}/{result.hints.length})
                </Button>
              )}
              <Button variant="accent" onClick={() => void revealHelp(true)} disabled={savingHelp}>
                {showAnswer ? "Hide answer" : "Reveal answer"}
              </Button>
            </div>
            {showAnswer && (
              <div className="inline-block bg-primary px-4 py-3 font-pixel text-sm text-primary-foreground pixel-box">
                Answer: {result.answer}
              </div>
            )}
            {!showAnswer && canCheckAnswer && (
              <AnswerChecker
                key={bankProblemId ?? problem}
                answer={result.answer}
                problemId={bankProblemId}
              />
            )}
            {showAnswer && bankProblemId && (
              <SourceSolution key={bankProblemId} problemId={bankProblemId} />
            )}
            {!canCheckAnswer && (
              <p className="text-sm text-muted-foreground">
                No automatic answer key is available. Compare your reasoning with the source
                solution.
              </p>
            )}
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
                  const latest =
                    result && revealed > 0
                      ? ` Hint ${revealed}. ${result.hints[revealed - 1]}`
                      : "";
                  const gimmick =
                    result && showGimmick && revealed === 0
                      ? ` The gimmick: ${result.gimmick}`
                      : "";
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
          <button
            type="button"
            disabled={!result}
            onClick={() => setShowGimmick((v) => !v)}
            aria-expanded={!!result && showGimmick}
            aria-label="Show or hide the gecko's gimmick"
            className="rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >
            <img
              src={geckoImg}
              alt="Gimmick Gecko mascot"
              width={1024}
              height={1024}
              className={`pixelated w-56 ${loading ? "animate-gecko" : ""}`}
            />
          </button>
        </div>
      </aside>
    </div>
  );
}
