import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/stars")({
  head: () => ({
    meta: [
      { title: "How Stars Work — Gimmick Gecko" },
      { name: "description", content: "Learn how Gimmick Gecko awards difficulty stars, deducts stars for hints, and tracks earned versus possible stars for each math concept." },
      { property: "og:title", content: "How Stars Work — Gimmick Gecko" },
      { property: "og:description", content: "Understand difficulty ratings, hint deductions, answer reveals, and your per-concept skill totals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StarsPage,
});

function StarsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <Button asChild variant="link" className="mb-8 px-0">
        <Link to="/"><ArrowLeft aria-hidden="true" /> Back to home</Link>
      </Button>
      <section aria-labelledby="stars-heading" className="border-b border-border pb-10">
        <div className="mb-6 flex items-center gap-3">
          <Star aria-hidden="true" className="h-7 w-7 shrink-0 fill-current text-accent" />
          <h1 id="stars-heading" className="font-pixel text-sm leading-relaxed text-primary sm:text-base">How stars work</h1>
        </div>
        <p className="mb-6 max-w-2xl leading-relaxed text-muted-foreground">
          Correct answers earn the difficulty rating in stars for <strong className="text-foreground">each concept covered</strong>.
        </p>
        <dl className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {["Very easy", "Easy", "Medium", "Hard", "Very hard"].map((label, index) => (
            <div key={label} className="border-l-2 border-accent pl-4">
              <dt className="mb-1 text-sm text-muted-foreground">{label}</dt>
              <dd className="font-semibold text-accent">{index + 1} {index === 0 ? "star" : "stars"}</dd>
            </div>
          ))}
        </dl>
        <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 font-semibold text-foreground">Each hint costs one star</h3>
            <p className="leading-relaxed text-muted-foreground">
              Each hint subtracts <strong className="text-accent">1 star</strong>, never below zero. For example: 3 stars − 1 hint = 2 stars.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-foreground">One question, one reward</h3>
            <p className="leading-relaxed text-muted-foreground">
              Wrong answer? Try again. Solved questions earn no extra stars. Revealing an answer leaves <strong className="text-highlight">0 stars available</strong> permanently; earned stars stay yours.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-foreground">Your skills: earned out of possible</h3>
            <p className="leading-relaxed text-muted-foreground">
              Earned stars / full stars possible from attempted or answer-revealed questions. Each question counts once per concept. Hints lower earned stars only.
            </p>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Reveal a new 1-star answer: <strong className="text-primary">1 / 2</strong> becomes <strong className="text-accent">1 / 3</strong>.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-foreground">Your own questions count too</h3>
            <p className="leading-relaxed text-muted-foreground">
              Sign in to track bank, typed, and uploaded questions together. The gecko assigns your questions a difficulty and concepts.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
