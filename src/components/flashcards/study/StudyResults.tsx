"use client";

import { ArrowLeft, RotateCcw, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StreakCounter } from "@/components/gamification/StreakCounter";
import { XPBadge } from "@/components/gamification/XPProgress";
import { cn } from "@/utils/cn";
import { useStudySession } from "./StudySessionContext";

type ResultStat = {
  label: string;
  value: React.ReactNode;
  tone?: "default" | "primary" | "success" | "destructive";
};

type StudyResultsProps = {
  icon: LucideIcon;
  title: string;
  message?: React.ReactNode;
  stats: ResultStat[];
  /** Highlighted note (perfect score, new record, ...). */
  highlight?: React.ReactNode;
  rewards?: { xp: number; level: number; streak: number };
  /** Label for the primary restart action. */
  againLabel?: string;
  onStudyAgain?: () => void;
  /** Extra secondary actions rendered next to "Back to set". */
  extraActions?: React.ReactNode;
  children?: React.ReactNode;
};

const TONE_CLASSES: Record<NonNullable<ResultStat["tone"]>, string> = {
  default: "text-foreground",
  primary: "text-primary",
  success: "text-success",
  destructive: "text-destructive",
};

/** End-of-session summary shared by Learn, Write, Match and Test. */
export function StudyResults({
  icon: Icon,
  title,
  message,
  stats,
  highlight,
  rewards,
  againLabel = "Study again",
  onStudyAgain,
  extraActions,
  children,
}: StudyResultsProps) {
  const session = useStudySession();

  return (
    <section
      className="rounded-3xl border border-border bg-card p-6 text-center shadow-card motion-safe:animate-slide-up sm:p-10"
      aria-labelledby="study-results-title"
    >
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-accent text-primary">
        <Icon className="size-7" aria-hidden />
      </div>
      <h2
        id="study-results-title"
        className="text-2xl font-bold tracking-tight sm:text-3xl"
      >
        {title}
      </h2>
      {message ? (
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">{message}</p>
      ) : null}

      <dl
        className={cn(
          "mx-auto mt-6 grid max-w-lg gap-3",
          stats.length >= 4
            ? "grid-cols-2 sm:grid-cols-4"
            : stats.length === 3
              ? "grid-cols-3"
              : "grid-cols-2"
        )}
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col-reverse rounded-2xl bg-secondary/60 px-3 py-4"
          >
            <dt className="mt-1 text-xs font-medium text-muted-foreground">
              {stat.label}
            </dt>
            <dd
              className={cn(
                "text-2xl font-bold tabular-nums",
                TONE_CLASSES[stat.tone ?? "default"]
              )}
            >
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      {highlight ? (
        <p className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-success/10 px-4 py-1.5 text-sm font-semibold text-success">
          {highlight}
        </p>
      ) : null}

      {children ? <div className="mt-6 text-left">{children}</div> : null}

      {rewards ? (
        <div className="mt-6 flex items-center justify-center gap-3">
          <StreakCounter streak={rewards.streak} size="sm" />
          <XPBadge xp={rewards.xp} level={rewards.level} />
        </div>
      ) : null}

      <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
        {session ? (
          <Button type="button" variant="outline" size="lg" onClick={session.exit}>
            <ArrowLeft aria-hidden />
            Back to set
          </Button>
        ) : null}
        {extraActions}
        {onStudyAgain ? (
          <Button type="button" size="lg" onClick={onStudyAgain}>
            <RotateCcw aria-hidden />
            {againLabel}
          </Button>
        ) : null}
      </div>
    </section>
  );
}
