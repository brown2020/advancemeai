"use client";

import { CalendarDays, CheckCircle2, Flame, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: number | null;
  className?: string;
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function streakMessage(streak: number): string {
  if (streak === 0) return "Study today to start a new streak.";
  if (streak === 1) return "Great start! Come back tomorrow to keep it going.";
  if (streak < 7) return `${plural(7 - streak, "more day")} to reach a full week.`;
  if (streak < 30) return `You're on fire! ${plural(30 - streak, "day")} to a month.`;
  return "Amazing dedication. Keep it up!";
}

/** Current streak, longest streak and last study date. */
export function StreakCard({
  currentStreak,
  longestStreak,
  lastStudyDate,
  className,
}: StreakCardProps) {
  const isActiveToday = lastStudyDate
    ? new Date(lastStudyDate).toDateString() === new Date().toDateString()
    : false;
  const isActive = currentStreak > 0;

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-medium text-muted-foreground">Current streak</h3>
        {isActiveToday && (
          <Badge variant="success">
            <CheckCircle2 aria-hidden />
            Studied today
          </Badge>
        )}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <span
          className={cn(
            "flex size-14 items-center justify-center rounded-2xl",
            isActive ? "bg-streak/10 text-streak" : "bg-secondary text-muted-foreground"
          )}
        >
          <Flame className={cn("size-8", isActive && "fill-current")} aria-hidden />
        </span>
        <p className="flex items-baseline gap-1.5">
          <span className="text-4xl font-bold tracking-tight tabular-nums">
            {currentStreak}
          </span>
          <span className="text-muted-foreground">
            day{currentStreak === 1 ? "" : "s"}
          </span>
        </p>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">{streakMessage(currentStreak)}</p>

      <dl className="mt-auto grid grid-cols-2 gap-4 border-t border-border pt-4">
        <div className="flex items-center gap-2">
          <Trophy className="size-4 shrink-0 text-streak" aria-hidden />
          <div>
            <dt className="text-xs text-muted-foreground">Longest</dt>
            <dd className="font-semibold tabular-nums">{plural(longestStreak, "day")}</dd>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <div>
            <dt className="text-xs text-muted-foreground">Last studied</dt>
            <dd className="font-semibold">
              {lastStudyDate ? new Date(lastStudyDate).toLocaleDateString() : "Never"}
            </dd>
          </div>
        </div>
      </dl>
    </div>
  );
}

/** Loading skeleton for StreakCard. */
export function StreakCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6",
        className
      )}
      aria-hidden
    >
      <Skeleton className="h-4 w-24" />
      <div className="mt-3 flex items-center gap-3">
        <Skeleton className="size-14 rounded-2xl" />
        <Skeleton className="h-10 w-16" />
      </div>
      <Skeleton className="mt-3 h-4 w-48" />
      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    </div>
  );
}
