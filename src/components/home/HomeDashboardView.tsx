import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  LineChart,
  Plus,
  Sparkles,
  Timer,
  type LucideIcon,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/utils/cn";
import { SectionHeading } from "@/components/common/UIComponents";
import { XPProgress } from "@/components/gamification/XPProgress";
import { StreakCounter } from "@/components/gamification/StreakCounter";
import type { DashboardData } from "@/types/dashboard";
import { getLevelFromXP } from "@/types/gamification";

type HomeDashboardViewProps = {
  displayName: string;
  data: DashboardData;
};

type QuickAction = {
  href: string;
  label: string;
  hint: string;
  icon: LucideIcon;
};

const QUICK_ACTIONS: QuickAction[] = [
  { href: "/flashcards/create", label: "New set", hint: "Make flashcards", icon: Plus },
  { href: "/practice", label: "SAT practice", hint: "Adaptive questions", icon: GraduationCap },
  { href: "/practice/full-test", label: "Full test", hint: "Timed, scored", icon: Timer },
  { href: "/study-guides/create", label: "AI study guide", hint: "From your notes", icon: Sparkles },
];

const tileClass =
  "rounded-2xl border border-border bg-card shadow-card transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function HomeDashboardView({ displayName, data }: HomeDashboardViewProps) {
  const { recentSets, continueStudying, gamification } = data;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 md:py-10">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Welcome back</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{displayName}</h1>
        </div>
        {gamification && (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1.5 shadow-card">
              <StreakCounter streak={gamification.currentStreak} size="sm" showLabel />
            </span>
            <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold shadow-card">
              Level {getLevelFromXP(gamification.xp)}
            </span>
          </div>
        )}
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-10">
          {continueStudying ? (
            <Link
              href={continueStudying.href}
              className="group relative flex items-center gap-5 overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground shadow-lift transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:p-8"
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-15 [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:18px_18px]"
                aria-hidden
              />
              <div className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary-foreground/15">
                {continueStudying.type === "practice" ? (
                  <GraduationCap className="size-7" aria-hidden />
                ) : (
                  <BookOpen className="size-7" aria-hidden />
                )}
              </div>
              <div className="relative min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/75">
                  Jump back in
                </p>
                <p className="mt-1 truncate text-xl font-bold">{continueStudying.title}</p>
                <p className="mt-0.5 text-sm text-primary-foreground/80">
                  {continueStudying.subtitle}
                </p>
              </div>
              <ArrowRight
                className="relative hidden size-6 shrink-0 transition-transform group-hover:translate-x-1 sm:block"
                aria-hidden
              />
            </Link>
          ) : (
            <div className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Get started
              </p>
              <p className="mt-1 text-xl font-bold">What do you want to study today?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Make a flashcard set or try a few adaptive SAT questions.
              </p>
            </div>
          )}

          <section aria-labelledby="quick-actions">
            <h2 id="quick-actions" className="sr-only">
              Quick actions
            </h2>
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {QUICK_ACTIONS.map((a) => (
                <li key={a.href}>
                  <Link href={a.href} className={cn(tileClass, "flex h-full flex-col p-4")}>
                    <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-accent text-primary">
                      <a.icon className="size-5" aria-hidden />
                    </span>
                    <span className="text-sm font-semibold">{a.label}</span>
                    <span className="text-xs text-muted-foreground">{a.hint}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <SectionHeading
              title="Your recent sets"
              action={
                <Link
                  href="/flashcards"
                  className={buttonVariants({ variant: "ghost", size: "sm" })}
                >
                  View library
                </Link>
              }
            />
            {recentSets.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-12 text-center">
                <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-accent text-primary">
                  <BookOpen className="size-6" aria-hidden />
                </div>
                <p className="font-semibold">No flashcard sets yet</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Make your first set, or find one someone else already made.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Link href="/flashcards/create" className={buttonVariants()}>
                    <Plus aria-hidden />
                    Create a set
                  </Link>
                  <Link
                    href="/search"
                    className={buttonVariants({ variant: "outline" })}
                  >
                    Find a set
                  </Link>
                </div>
              </div>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {recentSets.map((set) => (
                  <li key={set.id}>
                    <Link
                      href={`/flashcards/${set.id}`}
                      className={cn(tileClass, "flex h-full flex-col p-4")}
                    >
                      <span className="line-clamp-2 font-semibold">{set.title}</span>
                      <span className="mt-auto flex items-center gap-2 pt-3 text-xs text-muted-foreground">
                        <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold text-secondary-foreground">
                          {set.cards.length} {set.cards.length === 1 ? "term" : "terms"}
                        </span>
                        Updated {new Date(set.updatedAt).toLocaleDateString()}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="mb-4 flex items-center gap-2 font-semibold">
              <LineChart className="size-4 text-muted-foreground" aria-hidden />
              Your progress
            </h2>
            {gamification ? (
              <XPProgress
                xp={gamification.xp}
                size="md"
                showDetails
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Study a set or answer a few questions to start earning XP.
              </p>
            )}
            <Link
              href="/progress"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-5 w-full")}
            >
              See all progress
            </Link>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="font-semibold">Test day ready?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A full, timed practice test gives you a score estimate and a study plan.
            </p>
            <Link
              href="/practice/full-test"
              className={cn(buttonVariants({ variant: "soft", size: "sm" }), "mt-4 w-full")}
            >
              <Timer aria-hidden />
              Start a full test
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
