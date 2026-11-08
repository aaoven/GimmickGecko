import { createFileRoute, Link } from "@tanstack/react-router";
import { keepPreviousData, queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getProblemFilters, listProblems } from "@/lib/problems.functions";
import { PAGE_SIZE, problemSearchSchema, type ProblemSearch } from "@/lib/problem-search";
import { useServerFn } from "@tanstack/react-start";
import { useAccount } from "@/components/AccountSession";
import { saveProblemHelp } from "@/lib/attempts.functions";
import { toast } from "sonner";
import { AnswerChecker } from "@/components/AnswerChecker";
import { DifficultyStars } from "@/components/DifficultyStars";
import { MathText } from "@/components/MathText";
import { buttonVariants } from "@/components/ui/button";

const initialFilters = problemSearchSchema.parse({});
const problemsQuery = (filters: ProblemSearch) =>
  queryOptions({
    queryKey: ["problems", filters],
    queryFn: () => listProblems({ data: filters }),
    placeholderData: keepPreviousData,
  });
const filtersQuery = queryOptions({
  queryKey: ["problem-filters"],
  queryFn: () => getProblemFilters(),
  staleTime: 60_000,
});

export const Route = createFileRoute("/problems")({
  head: () => ({
    meta: [
      { title: "Problem Bank — Gimmick Gecko" },
      {
        name: "description",
        content:
          "Browse AIME, AMC, Euclid, CEMC Fermat and COMC problems filtered by the concepts needed to solve them.",
      },
      { property: "og:title", content: "Problem Bank — Gimmick Gecko" },
      {
        property: "og:description",
        content: "Filter past contest problems by concept and practice with gecko hints.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(problemsQuery(initialFilters)),
      context.queryClient.ensureQueryData(filtersQuery),
    ]),
  errorComponent: ({ reset }) => (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-pixel text-primary">The bank is taking a breather.</h1>
      <p className="my-4">We couldn't load the problem bank. Please try again.</p>
      <button className={buttonVariants()} onClick={reset}>
        Try again
      </button>
    </main>
  ),
  component: ProblemsPage,
});

function ProblemsPage() {
  const saveHelp = useServerFn(saveProblemHelp);
  const { user } = useAccount();
  const { data: metadata } = useSuspenseQuery(filtersQuery);
  const [filters, setFilters] = useState(initialFilters);
  const [search, setSearch] = useState("");
  const { data, isFetching, isPlaceholderData, isError, refetch } = useQuery(
    problemsQuery(filters),
  );
  const { concepts: selected, contest, difficulty } = filters;
  const setContest = (value: string) => setFilters((f) => ({ ...f, contest: value, page: 0 }));
  const setDifficulty = (value: number) =>
    setFilters((f) => ({ ...f, difficulty: value, page: 0 }));
  const setSelected = (value: string[]) => setFilters((f) => ({ ...f, concepts: value, page: 0 }));
  useEffect(() => {
    const timer = setTimeout(
      () => setFilters((f) => (f.query === search ? f : { ...f, query: search, page: 0 })),
      300,
    );
    return () => clearTimeout(timer);
  }, [search]);
  const [openAnswer, setOpenAnswer] = useState<string | null>(null);

  const toggle = (c: string) =>
    setSelected(
      selected.includes(c) ? selected.filter((x) => x !== c) : [...selected, c].slice(0, 8),
    );
  const filtered = data?.problems ?? [];
  const total = data?.total ?? 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-2 font-pixel text-lg text-primary sm:text-2xl">Problem bank</h1>
      <p className="mb-6 text-lg text-muted-foreground">
        Learn a topic across all contests, or focus on the contest you're training for.
      </p>
      <label className="mb-8 block max-w-xl">
        Search problem text
        <input
          type="search"
          value={search}
          maxLength={100}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Try triangles, integers, or a phrase from a problem"
          className="mt-2 w-full border-2 border-border bg-input p-3"
        />
      </label>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit space-y-6 bg-card p-4 pixel-box lg:sticky lg:top-6">
          <div>
            <div className="mb-2 font-pixel text-[10px] uppercase text-muted-foreground">
              Contest
            </div>
            <select
              aria-label="Contest"
              value={contest}
              onChange={(e) => setContest(e.target.value)}
              className="w-full bg-input p-2"
            >
              <option value="">All contests · general learning</option>
              {metadata.contests.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <div className="mb-2 font-pixel text-[10px] uppercase text-muted-foreground">
              Difficulty
            </div>
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2, 3, 4, 5].map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  aria-label={d === 0 ? "Any difficulty" : `Difficulty ${d} out of 5 stars`}
                  aria-pressed={difficulty === d}
                  className={`px-2 py-1 font-pixel text-[9px] ${difficulty === d ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                >
                  {d === 0 ? (
                    "All"
                  ) : (
                    <span className={difficulty === d ? undefined : "text-accent"}>
                      {"★".repeat(d)}
                    </span>
                  )}
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
            <p className="mb-2 text-sm text-muted-foreground">
              Match all selected topics (up to 8).
            </p>
            <div className="flex max-h-80 flex-wrap gap-2 overflow-y-auto">
              {metadata.concepts.map(({ name: c, count: n }) => (
                <button
                  key={c}
                  onClick={() => toggle(c)}
                  aria-pressed={selected.includes(c)}
                  disabled={!selected.includes(c) && selected.length >= 8}
                  className={`px-2 py-1 text-sm ${selected.includes(c) ? "bg-accent text-accent-foreground" : "bg-secondary hover:brightness-125"}`}
                >
                  {c} <span className="opacity-60">{n}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="space-y-4" aria-busy={isFetching}>
          <div
            role="status"
            className="font-pixel text-[10px] leading-relaxed uppercase text-muted-foreground"
          >
            {isFetching
              ? "Finding problems…"
              : `${total.toLocaleString()} problem${total === 1 ? "" : "s"}`}
          </div>
          {isError && (
            <div role="alert" className="bg-card p-6 pixel-box">
              Couldn't load those problems.{" "}
              <button onClick={() => void refetch()} className="underline">
                Try again
              </button>
            </div>
          )}
          {!isFetching && !isError && filtered.length === 0 && (
            <div className="bg-card p-6 pixel-box">
              No problems match those filters.{" "}
              <button
                className="underline"
                onClick={() => {
                  setSearch("");
                  setFilters(initialFilters);
                }}
              >
                Clear filters
              </button>
            </div>
          )}
          {filtered.map((p) => (
            <article key={p.id} className="bg-card p-5 pixel-box">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span className="bg-primary px-2 py-1 font-pixel text-[10px] text-primary-foreground">
                  {p.contest} {p.year}
                  {p.problem_number ? ` #${p.problem_number}` : ""}
                </span>
                <DifficultyStars value={p.difficulty} />
              </div>
              <p className="mb-4 text-lg leading-relaxed">
                <MathText text={p.statement} />
              </p>
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
                <Link
                  to="/ask"
                  search={{ problemId: p.id }}
                  className={buttonVariants({ size: "sm" })}
                >
                  Get gecko hints
                </Link>
                {p.answer != null && (
                  <button
                    onClick={async () => {
                      if (openAnswer === p.id) {
                        setOpenAnswer(null);
                        return;
                      }
                      try {
                        if (user)
                          await saveHelp({
                            data: { problemId: p.id, hints: 0, answerRevealed: true },
                          });
                        setOpenAnswer(p.id);
                      } catch {
                        toast.error("Could not save answer reveal. Try again.");
                      }
                    }}
                    className={buttonVariants({ size: "sm", variant: "secondary" })}
                  >
                    {openAnswer === p.id ? `Answer: ${p.answer}` : "Show answer"}
                  </button>
                )}
                {p.answer == null && (
                  <span className="text-sm text-muted-foreground">
                    Written response · no automatic answer key
                  </span>
                )}
              </div>
              <AnswerChecker answer={p.answer} problemId={p.id} />
            </article>
          ))}
          {total > PAGE_SIZE && (
            <nav
              aria-label="Problem pages"
              className="flex items-center justify-between gap-3 py-4"
            >
              <button
                className={buttonVariants({ variant: "secondary" })}
                disabled={filters.page === 0 || isFetching}
                onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              >
                Previous
              </button>
              <span className="text-sm">
                Page {filters.page + 1} of {Math.ceil(total / PAGE_SIZE)}
              </span>
              <button
                className={buttonVariants({ variant: "secondary" })}
                disabled={
                  isFetching || isPlaceholderData || (filters.page + 1) * PAGE_SIZE >= total
                }
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              >
                Next
              </button>
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}
