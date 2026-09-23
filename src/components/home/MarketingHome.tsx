import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Brain,
  Check,
  ClipboardCheck,
  Flame,
  GraduationCap,
  Layers,
  PenLine,
  Puzzle,
  Sparkles,
  Timer,
  Users,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { buttonVariants } from "@/components/ui/button-variants";

const STUDY_MODES = [
  { label: "Flashcards", icon: Layers },
  { label: "Learn", icon: Brain },
  { label: "Write", icon: PenLine },
  { label: "Match", icon: Puzzle },
  { label: "Test", icon: ClipboardCheck },
];

const FEATURES = [
  {
    icon: BookOpen,
    title: "Flashcards that stick",
    body: "Make a set in minutes or import one. Study it five ways, from quick flips to timed tests.",
  },
  {
    icon: GraduationCap,
    title: "Adaptive SAT practice",
    body: "Reading, Writing and Math questions that get harder as you improve, with explanations for every miss.",
  },
  {
    icon: Timer,
    title: "Full-length practice tests",
    body: "Sit a timed Digital SAT-style test and get a score breakdown plus a study plan.",
  },
  {
    icon: Sparkles,
    title: "AI study guides",
    body: "Paste your notes and get a study guide and flashcards back. Ask the tutor when you're stuck.",
  },
  {
    icon: Flame,
    title: "Streaks and progress",
    body: "XP, streaks and mastery tracking show what you know and what needs another pass.",
  },
  {
    icon: Users,
    title: "Classes",
    body: "Teachers share sets with a class and see who's practicing. Students join with a code.",
  },
];

const STEPS = [
  {
    title: "Pick what to learn",
    body: "Build a flashcard set, find a public one, or choose an SAT section.",
  },
  {
    title: "Practice the smart way",
    body: "Study modes and adaptive questions focus your time on what you miss.",
  },
  {
    title: "Watch your score climb",
    body: "Track mastery, keep your streak, and retake tests to measure progress.",
  },
];

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none" aria-hidden>
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-accent/70 blur-2xl" />

      {/* Flashcard stack */}
      <div className="relative">
        <div className="absolute inset-x-6 -bottom-3 h-full rounded-3xl border border-border bg-card/70" />
        <div className="absolute inset-x-3 -bottom-1.5 h-full rounded-3xl border border-border bg-card/90" />
        <div className="relative flex aspect-[16/10] flex-col rounded-3xl border border-border bg-card p-6 shadow-lift">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Vocab · Unit 4</span>
            <span className="tabular-nums">7 / 24</span>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <p className="text-3xl font-bold tracking-tight sm:text-4xl">ubiquitous</p>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
            <div className="h-full w-[29%] rounded-full bg-primary" />
          </div>
        </div>
      </div>

      {/* SAT question chip */}
      <div className="relative mt-7 ml-auto w-[82%] rounded-2xl border border-border bg-card p-4 shadow-lift">
        <p className="mb-3 text-xs font-semibold text-muted-foreground">
          Math · Question 12
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2.5 rounded-xl border border-border px-3 py-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-secondary text-xs font-bold">
              A
            </span>
            x = 3
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-success bg-success/10 px-3 py-2 font-medium">
            <span className="flex size-6 items-center justify-center rounded-md bg-success text-success-foreground">
              <Check className="size-3.5" />
            </span>
            x = 7
          </div>
        </div>
      </div>

      {/* Streak badge */}
      <div className="absolute -top-4 right-4 flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-sm font-semibold shadow-lift">
        <Flame className="size-4 text-streak" />
        12-day streak
      </div>
    </div>
  );
}

/** Signed-out landing page. Server component: no auth hooks. */
export function MarketingHome() {
  return (
    <div className="overflow-x-clip">
      {/* Hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-14 px-4 pb-16 pt-12 sm:px-6 md:pt-20 lg:grid-cols-[1.05fr_1fr] lg:pb-24">
        <div className="animate-slide-up">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground shadow-card">
            <Sparkles className="size-3.5 text-primary" aria-hidden />
            Flashcards + SAT prep, in one place
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Study smarter.
            <br />
            <span className="text-primary">Score higher.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Make flashcards, master them with five study modes, and prep for the
            SAT with adaptive practice that meets you where you are.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/auth/signup" className={buttonVariants({ size: "lg" })}>
              Get started free
              <ArrowRight aria-hidden />
            </Link>
            <Link
              href="/flashcards"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Browse flashcards
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-2">
            {STUDY_MODES.map((m) => (
              <li
                key={m.label}
                className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground"
              >
                <m.icon className="size-3.5" aria-hidden />
                {m.label}
              </li>
            ))}
          </ul>
        </div>
        <HeroVisual />
      </section>

      {/* Features */}
      <section id="features" className="border-y border-border bg-surface py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Learn it. Then prove it.
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              Everything you need for class and for test day.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-card"
              >
                <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-accent text-primary">
                  <f.icon className="size-5" aria-hidden />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
        <h2 className="mb-10 text-center text-3xl font-bold tracking-tight sm:text-4xl">
          How it works
        </h2>
        <ol className="grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {i + 1}
              </span>
              <div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <section className="px-4 pb-16 sm:px-6 md:pb-24">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground sm:px-12">
          <div
            className="pointer-events-none absolute inset-0 opacity-15 [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:18px_18px]"
            aria-hidden
          />
          <h2 className="relative text-3xl font-bold tracking-tight sm:text-4xl">
            Your next study session starts here
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-primary-foreground/80">
            Free to use. Make your first set or start SAT practice in under a minute.
          </p>
          <Link
            href="/auth/signup"
            className={cn(
              buttonVariants({ size: "lg" }),
              "relative mt-8 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            )}
          >
            Create your free account
          </Link>
        </div>
      </section>
    </div>
  );
}
