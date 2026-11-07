import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { HintCoach } from "@/components/HintCoach";

export const Route = createFileRoute("/")({
  validateSearch: z.object({ problem: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Gimmick Gecko — Contest Math Hints" },
      { name: "description", content: "Upload a math contest problem and get progressive hints, key concepts and the gimmick from a pixel gecko." },
      { property: "og:title", content: "Gimmick Gecko — Contest Math Hints" },
      { property: "og:description", content: "Progressive hints, key concepts and gimmicks for AMC and AIME problems." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { problem } = Route.useSearch();
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-2 font-pixel text-lg leading-relaxed text-primary sm:text-2xl">Stuck? Ask the gecko.</h1>
      <p className="mb-8 max-w-2xl text-lg text-muted-foreground">
        Paste or snap a contest problem. Get the key concepts, the hidden gimmick, and hints one step at a time.
      </p>
      <HintCoach key={problem ?? ""} initialProblem={problem ?? ""} />
    </main>
  );
}
