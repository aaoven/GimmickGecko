import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import geckoImg from "@/assets/gecko.png";
import { Button } from "@/components/ui/button";
import { getHints } from "@/lib/hints.functions";
import type { HintResult } from "@/lib/hints.server";

export function HintCoach({ initialProblem = "" }: { initialProblem?: string }) {
  const fetchHints = useServerFn(getHints);
  const [problem, setProblem] = useState(initialProblem);
  const [image, setImage] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HintResult | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

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
    try {
      const res = await fetchHints({ data: { problem, imageDataUrl: image } });
      if (!res.ok) toast.error(res.error);
      else setResult(res.result);
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
        ? `A ${result.topic} problem! Here's the gimmick. Want a hint?`
        : revealed < result.hints.length
          ? "Keep going — try it before the next hint!"
          : "That's all my hints. You've got this!";

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
            <Button variant="secondary" asChild>
              <label className="cursor-pointer">
                <ImagePlus /> Upload image
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
              </label>
            </Button>
            <Button onClick={submit} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : null}
              {loading ? "Thinking" : "Ask the gecko"}
            </Button>
          </div>
        </div>

        {result && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
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
            <div className="flex flex-wrap gap-3">
              {revealed < result.hints.length && (
                <Button onClick={() => setRevealed((r) => r + 1)}>
                  Next hint ({revealed + 1}/{result.hints.length})
                </Button>
              )}
              <Button variant="accent" onClick={() => setShowAnswer((s) => !s)}>
                {showAnswer ? "Hide answer" : "Reveal answer"}
              </Button>
            </div>
            {showAnswer && (
              <div className="inline-block bg-primary px-4 py-3 font-pixel text-sm text-primary-foreground pixel-box">
                Answer: {result.answer}
              </div>
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
