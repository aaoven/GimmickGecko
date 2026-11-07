import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { listProblems } from "@/lib/problems.functions";
import { buttonVariants } from "@/components/ui/button";

const problemsQuery = queryOptions({ queryKey: ["problems"], queryFn: () => listProblems() });

export const Route = createFileRoute("/problems")({
  head: () => ({
    meta: [
      { title: "Problem Bank — Gimmick Gecko" },
      { name: "description", content: "Browse past AIME and contest problems filtered by the concepts needed to solve them." },
      { property: "og:title", content: "Problem Bank — Gimmick Gecko" },
      { property: "og:description", content: "Filter past contest problems by concept and practice with gecko hints." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(problemsQuery),
  component: ProblemsPage,
});

function ProblemsPage() {
  const { data: problems } = useSuspenseQuery(problemsQuery);
  const [selected, setSelected] = useState<string[]>([]);
  const [contest, setContest] = useState("All");
  const [openAnswer, setOpenAnswer] = useState<string | null>(null);

  const concepts = useMemo(() => {
    const counts = new Map<string, number>();
    problems.forEach((p) => p.concepts.forEach((c) => counts.set(c, (counts.get(c) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [problems]);
  const contests = useMemo(() => ["All", ...new Set(problems.map((p) => p.contest))], [problems]);

  const filtered = problems.filter(
    (p) =>
      (contest === "All" || p.contest === contest) && selected.every((c) => p.concepts.includes(c)),
  );

  const toggle = (c: string) =>
    setSelected((s) => (s.includes(c) ? s.filter((x) => x !== c) : [...s, c]));

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-2 font-pixel text-lg text-primary sm:text-2xl">Problem bank</h1>
      <p className="mb-8 text-lg text-muted-foreground">Pick concepts to find problems that need all of them.</p>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit space-y-6 bg-card p-4 pixel-box lg:sticky lg:top-6">
          <div>
            <div className="mb-2 font-pixel text-[10px] uppercase text-muted-foreground">Contest</div>
            <div className="flex flex-wrap gap-2">
              {contests.map((c) => (
                <button
                  key={c}
                  onClick={() => setContest(c)}
                  className={`px-2 py-1 font-pixel text-[9px] uppercase ${contest === c ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between font-pixel text-[10px] uppercase text-muted-foreground">
              Concepts
              {selected.length > 0 && (
                <button onClick={() => setSelected([])} className="text-accent">
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {concepts.map(([c, n]) => (
                <button
                  key={c}
                  onClick={() => toggle(c)}
                  className={`px-2 py-1 text-sm ${selected.includes(c) ? "bg-accent text-accent-foreground" : "bg-secondary hover:brightness-125"}`}
                >
                  {c} <span className="opacity-60">{n}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="space-y-4">
          <div className="font-pixel text-[10px] uppercase text-muted-foreground">
            {filtered.length} problem{filtered.length === 1 ? "" : "s"}
          </div>
          {filtered.length === 0 && (
            <div className="bg-card p-6 pixel-box">No problems match all of those concepts. Try removing one.</div>
          )}
          {filtered.map((p) => (
            <article key={p.id} className="bg-card p-5 pixel-box">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span className="bg-primary px-2 py-1 font-pixel text-[10px] text-primary-foreground">
                  {p.contest} {p.year}
                  {p.problem_number ? ` #${p.problem_number}` : ""}
                </span>
                <span className="font-mono text-xl text-accent" aria-label={`Difficulty ${p.difficulty} of 5`}>
                  {"■".repeat(p.difficulty)}
                  <span className="text-muted">{"■".repeat(5 - p.difficulty)}</span>
                </span>
              </div>
              <p className="mb-4 text-lg leading-relaxed">{p.statement}</p>
              <div className="mb-4 flex flex-wrap gap-2">
                {p.concepts.map((c) => (
                  <span
                    key={c}
                    className={`px-2 py-0.5 text-xs ${selected.includes(c) ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"}`}
                  >
                    {c}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link to="/" search={{ problem: p.statement }} className={buttonVariants({ size: "sm" })}>
                  Get gecko hints
                </Link>
                <button
                  onClick={() => setOpenAnswer(openAnswer === p.id ? null : p.id)}
                  className={buttonVariants({ size: "sm", variant: "secondary" })}
                >
                  {openAnswer === p.id ? `Answer: ${p.answer}` : "Show answer"}
                </button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
