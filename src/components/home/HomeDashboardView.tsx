import Link from "next/link";
import {
  BookOpen,
  Brain,
  ChevronRight,
  ClipboardList,
  Flame,
  Plus,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { XPProgress } from "@/components/gamification/XPProgress";
import { StreakCounter } from "@/components/gamification/StreakCounter";
import type { DashboardData } from "@/types/dashboard";

type HomeDashboardViewProps = {
  displayName: string;
  data: DashboardData;
};

export function HomeDashboardView({ displayName, data }: HomeDashboardViewProps) {
  const { recentSets, continueStudying, gamification } = data;

  return (
    <div className="flex flex-col w-full">
      <section className="w-full py-10 md:py-14 bg-gradient-to-b from-background to-muted/40 border-b border-border">
        <div className="container px-4 md:px-6 mx-auto">
          <p className="text-sm text-muted-foreground mb-1">Your dashboard</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-2">
            Welcome back, {displayName}
          </h1>
          <p className="text-muted-foreground max-w-2xl mb-6">
            Pick up where you left off or start something new.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/flashcards/create"
              className={cn(buttonVariants({ size: "default" }), "gap-2")}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Create flashcard set
            </Link>
            <Link
              href="/practice"
              className={cn(
                buttonVariants({ variant: "outline", size: "default" }),
                "gap-2"
              )}
            >
              <Brain className="h-4 w-4" aria-hidden />
              SAT practice
            </Link>
            <Link
              href="/quizzes"
              className={cn(
                buttonVariants({ variant: "outline", size: "default" }),
                "gap-2"
              )}
            >
              <ClipboardList className="h-4 w-4" aria-hidden />
              Quizzes
            </Link>
          </div>
        </div>
      </section>

      {gamification && (
        <section
          className="w-full py-6 border-b border-border bg-muted/20"
          aria-label="Your progress stats"
        >
          <div className="container px-4 md:px-6 mx-auto flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex-1 min-w-0 max-w-md">
              <XPProgress
                xp={gamification.xp}
                level={gamification.level}
                size="md"
                showDetails
              />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3">
              <Flame className="h-5 w-5 text-orange-500" aria-hidden />
              <StreakCounter
                streak={gamification.currentStreak}
                size="md"
                showLabel
              />
            </div>
            <Link
              href="/progress"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "shrink-0"
              )}
            >
              View all progress
            </Link>
          </div>
        </section>
      )}

      <section className="w-full py-10 md:py-12">
        <div className="container px-4 md:px-6 mx-auto space-y-10">
          {continueStudying && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Continue studying</h2>
              <Link
                href={continueStudying.href}
                className={cn(
                  "group flex items-center justify-between gap-4 rounded-xl border border-border",
                  "bg-card p-5 shadow-sm transition-colors hover:bg-accent/50",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {continueStudying.title}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {continueStudying.subtitle}
                  </p>
                </div>
                <ChevronRight
                  className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors"
                  aria-hidden
                />
              </Link>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-semibold">Your recent sets</h2>
              <Link
                href="/flashcards"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                View library
              </Link>
            </div>

            {recentSets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <BookOpen
                  className="h-10 w-10 mx-auto text-muted-foreground mb-3"
                  aria-hidden
                />
                <p className="text-muted-foreground mb-4">
                  You have not created any flashcard sets yet.
                </p>
                <Link
                  href="/flashcards/create"
                  className={cn(buttonVariants(), "gap-2")}
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  Create your first set
                </Link>
              </div>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recentSets.map((set) => (
                  <li key={set.id}>
                    <Link
                      href={`/flashcards/${set.id}`}
                      className={cn(
                        "block rounded-xl border border-border bg-card p-4 h-full",
                        "transition-colors hover:bg-accent/50",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      )}
                    >
                      <p className="font-medium truncate">{set.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {set.cards.length}{" "}
                        {set.cards.length === 1 ? "card" : "cards"}
                        <span className="mx-1.5" aria-hidden>
                          ·
                        </span>
                        Updated{" "}
                        {new Date(set.updatedAt).toLocaleDateString()}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {!continueStudying && recentSets.length > 0 && (
            <p className="text-sm text-muted-foreground text-center">
              Start a{" "}
              <Link href="/practice" className="underline underline-offset-4">
                practice session
              </Link>{" "}
              to see it here next time.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
