import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, BookOpen, Lightbulb, Volume2 } from "lucide-react";
import geckoImg from "@/assets/gecko.png";

export const Route = createFileRoute("/")({
  validateSearch: z.object({ problem: z.string().optional(), problemId: z.string().uuid().optional() }),
  head: () => ({
    meta: [
      { title: "Gimmick Gecko — Contest Math Practice" },
      { name: "description", content: "Practice math contest problems with a pixel gecko coach: progressive hints, a filterable problem bank, and a skill dashboard that tracks every concept." },
      { property: "og:title", content: "Gimmick Gecko — Contest Math Practice" },
      { property: "og:description", content: "Progressive gecko hints, a concept-filtered problem bank, and a dashboard that finds your weakest concepts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function Index() {
  const { problem, problemId } = Route.useSearch();
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-2 font-pixel text-lg leading-relaxed text-primary sm:text-2xl">Stuck? Ask the gecko.</h1>
      <p className="mb-8 max-w-2xl text-lg text-muted-foreground">
        Paste or snap a contest problem. Get the key concepts, the hidden gimmick, and hints one step at a time.
      </p>
      <HintCoach key={problemId ?? problem ?? ""} initialProblem={problem ?? ""} problemId={problemId} />
    </main>
  );
}
