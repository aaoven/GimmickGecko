import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, BookOpen, Lightbulb, Star, Volume2 } from "lucide-react";
import geckoImg from "@/assets/gecko.png";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
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

const features = [
  {
    icon: Lightbulb,
    title: "Progressive hints",
    body: (
      <>
        Paste a problem or snap a photo. The gecko names the <strong className="font-semibold text-foreground">key concepts</strong>, reveals the{" "}
        <strong className="font-semibold text-highlight">hidden gimmick</strong>, then drops hints one step at a time — never the whole solution at once.
      </>
    ),
  },
  {
    icon: Volume2,
    title: "A voice that teaches",
    body: (
      <>
        Every hint is <strong className="font-semibold text-foreground">read aloud</strong> in the gecko's warm old-professor voice. Auto-read is on by default; stop it any time.
      </>
    ),
  },
  {
    icon: BookOpen,
    title: "A real problem bank",
    body: (
      <>
        Past <strong className="font-semibold text-foreground">contest problems</strong> you can filter by contest, difficulty, and the concepts they require, each rated{" "}
        <strong className="font-semibold text-accent">one to five stars</strong>. Check your answer right on the card.
      </>
    ),
  },
  {
    icon: BarChart3,
    title: "A dashboard that knows you",
    body: (
      <>
        Sign in to track <strong className="font-semibold text-foreground">earned and possible stars for each concept</strong> from bank problems and your own typed or uploaded questions, with recommendations that target your{" "}
        <strong className="font-semibold text-accent">weakest concepts</strong>.
      </>
    ),
  },
];

function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <section className="mb-16 grid items-center gap-10 lg:grid-cols-[1fr_280px]">
        <div>
          <p className="mb-4 font-pixel text-[10px] uppercase text-accent">Your contest math coach</p>
          <h1 className="mb-5 font-pixel text-2xl leading-relaxed text-primary sm:text-4xl sm:leading-relaxed">
            Stuck on a problem? <span className="text-foreground">Ask the gecko.</span>
          </h1>
          <p className="mb-8 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Gimmick Gecko trains you for math contests the way a coach would: hints before answers, gimmicks before grinding,
            and a record of exactly which concepts need work.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Button asChild size="lg" className="h-auto gap-3 px-8 py-5 pixel-box-lg sm:text-sm">
              <Link to="/ask">Ask the gecko <ArrowRight className="h-5 w-5" /></Link>
            </Button>
            <Link to="/problems" className="px-2 py-1 text-lg text-muted-foreground underline underline-offset-4 hover:text-foreground">
              or browse the problem bank
            </Link>
          </div>
        </div>
        <img src={geckoImg} alt="Gimmick Gecko, a pixel-art professor gecko" width={1024} height={1024} className="pixelated mx-auto w-52 animate-gecko lg:w-64" />
      </section>

      <section className="mb-16">
        <h2 className="mb-2 font-pixel text-sm text-primary sm:text-base">Everything you need to train</h2>
        <p className="mb-8 text-muted-foreground">Four tools, one feedback loop: practice, check, review, repeat.</p>
        <div className="grid gap-6 sm:grid-cols-2">
          {features.map((f) => (
            <article key={f.title} className="bg-card p-6 pixel-box">
              <f.icon className="mb-4 h-8 w-8 text-accent" />
              <h3 className="mb-3 font-pixel text-[11px] uppercase text-primary">{f.title}</h3>
              <p className="leading-relaxed text-muted-foreground">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="stars-heading" className="mb-16 border-y border-border py-10">
        <div className="mb-6 flex items-center gap-3">
          <Star aria-hidden="true" className="h-7 w-7 shrink-0 fill-current text-accent" />
          <h2 id="stars-heading" className="font-pixel text-sm leading-relaxed text-primary sm:text-base">How stars work</h2>
        </div>
        <p className="mb-6 max-w-2xl leading-relaxed text-muted-foreground">
          A question's difficulty is also its star value. Answer correctly without help to earn all its stars for <strong className="text-foreground">every concept it covers</strong>.
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
              Hints unfold one at a time. Each new hint lowers your available reward by <strong className="text-accent">1 star</strong>, never below zero. A 3-star problem with one hint earns 2 stars; a 1-star problem with one hint earns 0. The tracker beside the hint buttons shows what's left.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-foreground">One question, one reward</h3>
            <p className="leading-relaxed text-muted-foreground">
              A wrong answer earns no stars, but you can try again. Once you've solved a question, repeating it earns no extra stars. Revealing its answer makes the remaining reward <strong className="text-highlight">0 stars</strong>, even if you hide it again. Stars already earned stay yours.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-foreground">Your skills: earned out of possible</h3>
            <p className="leading-relaxed text-muted-foreground">
              Each concept shows the stars you've earned out of the full difficulty stars of the questions you've attempted or revealed. Each question counts once per covered concept; hints reduce earned stars, not possible stars.
            </p>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              For example, if a concept shows <strong className="text-primary">1 / 2 stars</strong> and you reveal a new 1-star question covering it, the total becomes <strong className="text-accent">1 / 3 stars</strong>. Revealing it again won't change the total.
            </p>
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-foreground">Your own questions count too</h3>
            <p className="leading-relaxed text-muted-foreground">
              Sign in to save your progress. The gecko categorizes typed and uploaded questions by concept and assigns a difficulty rating. Your answers contribute to the same skill breakdown as bank practice, helping identify which concepts need more work.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-panel p-8 text-center pixel-box-lg">
        <h2 className="mb-3 font-pixel text-sm text-primary sm:text-base">Ready for your first gimmick?</h2>
        <p className="mx-auto mb-6 max-w-md text-muted-foreground">
          Bring a problem that's been beating you. The gecko will meet you where you are.
        </p>
        <Button asChild size="lg" className="h-auto gap-3 px-8 py-5 sm:text-sm">
          <Link to="/ask">Ask the gecko <ArrowRight className="h-5 w-5" /></Link>
        </Button>
      </section>
    </main>
  );
}
