import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { HintCoach } from "@/components/HintCoach";
import { getProblem } from "@/lib/problems.functions";
import { MathText } from "@/components/MathText";
import { DifficultyStars } from "@/components/DifficultyStars";

export const Route = createFileRoute("/ask")({
  validateSearch: z.object({
    problem: z.string().optional(),
    problemId: z.string().uuid().optional(),
  }),
  loaderDeps: ({ search }) => ({ problemId: search.problemId }),
  loader: ({ deps }) => (deps.problemId ? getProblem({ data: { id: deps.problemId } }) : null),
  errorComponent: () => (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p>That problem could not be loaded.</p>
      <Link to="/problems" className="text-primary underline">
        Return to the problem bank
      </Link>
    </main>
  ),
  head: () => ({
    meta: [
      { title: "Ask the Gecko — Gimmick Gecko" },
      {
        name: "description",
        content:
          "Upload a math contest problem and get progressive hints, key concepts and the gimmick from a pixel gecko.",
      },
      { property: "og:title", content: "Ask the Gecko — Gimmick Gecko" },
      {
        property: "og:description",
        content: "Progressive hints, key concepts and gimmicks for AMC and AIME problems.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AskPage,
});

function AskPage() {
  const { problem, problemId } = Route.useSearch();
  const bank = Route.useLoaderData();
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-2 font-pixel text-lg leading-relaxed text-primary sm:text-2xl">
        Stuck? Ask the gecko.
      </h1>
      <p className="mb-8 max-w-2xl text-lg text-muted-foreground">
        Paste or snap a contest problem. Get the key concepts, the hidden gimmick, and hints one
        step at a time.
      </p>
      {bank && (
        <section className="mb-8 space-y-4 bg-card p-5 pixel-box">
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="font-pixel text-xs text-primary">
              {bank.problem.contest} {bank.problem.year} #{bank.problem.problem_number}
            </h2>
            <DifficultyStars value={bank.problem.difficulty} />
          </div>
          <MathText text={bank.problem.statement} className="text-lg" />
          {bank.details?.images.map((image, index) => (
            <img
              key={index}
              src={image.url}
              alt={image.alt || "Contest problem diagram"}
              style={image.rotation ? { transform: `rotate(${image.rotation}deg)` } : undefined}
              className="max-h-96 max-w-full bg-white p-3"
            />
          ))}
          {bank.details?.sourceUrl && (
            <a
              href={bank.details.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-primary underline"
            >
              Original problem
              {bank.details.sourcePages.length
                ? ` · page ${bank.details.sourcePages.join(", ")}`
                : ""}
            </a>
          )}
          {bank.details?.visualRequired && !bank.details.images.length && (
            <p className="text-muted-foreground">
              This question uses a diagram or source layout. Open the original problem to view it.
            </p>
          )}
          {bank.details && (
            <p className="text-sm text-muted-foreground">
              {bank.details.style.join(" · ")}
              {bank.details.estimated ? " · Difficulty and topic labels are estimates." : ""}
            </p>
          )}
        </section>
      )}
      <HintCoach
        key={problemId ?? problem ?? ""}
        initialProblem={bank?.problem.statement ?? problem ?? ""}
        problemId={problemId}
      />
      {!!bank?.details?.related.length && (
        <section className="mt-10">
          <h2 className="mb-4 font-pixel text-xs text-primary">Try a related puzzle</h2>
          <p className="mb-3 text-muted-foreground">
            Similar topics and techniques across contests.
          </p>
          <div className="flex flex-wrap gap-3">
            {bank.details.related.map((p) => (
              <Link
                key={p.id}
                to="/ask"
                search={{ problemId: p.id }}
                className="bg-card p-3 pixel-box"
              >
                {p.label} <DifficultyStars value={p.difficulty} />
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
