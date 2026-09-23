"use client";

import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";

interface WeeklyProgressProps {
  /** Array of study minutes for each day of the week (Sun-Sat) */
  weeklyMinutes: number[];
  className?: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAILY_GOAL_MINUTES = 30;

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/** Bar chart of study minutes for the last seven days, with a daily goal line. */
export function WeeklyProgress({ weeklyMinutes, className }: WeeklyProgressProps) {
  const { maxMinutes, totalMinutes, averageMinutes, goalDays } = useMemo(() => {
    const max = Math.max(...weeklyMinutes, 60); // At least 60 minutes for scale
    const total = weeklyMinutes.reduce((a, b) => a + b, 0);
    return {
      maxMinutes: max,
      totalMinutes: total,
      averageMinutes: Math.round(total / 7),
      goalDays: weeklyMinutes.filter((m) => m >= DAILY_GOAL_MINUTES).length,
    };
  }, [weeklyMinutes]);

  const today = new Date().getDay();
  // Bars are h-32 (8rem) above a 1.5rem label row + 0.375rem gap.
  const goalFraction = Math.min(1, DAILY_GOAL_MINUTES / maxMinutes);

  return (
    <div className={cn("space-y-5", className)}>
      <dl className="grid grid-cols-3 gap-3">
        {[
          { label: "This week", value: formatTime(totalMinutes) },
          { label: "Daily avg", value: formatTime(averageMinutes) },
          { label: "Goal days", value: `${goalDays}/7` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl bg-secondary px-3 py-2">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-lg font-bold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="relative">
        {/* Goal line */}
        <div
          className="pointer-events-none absolute inset-x-0 z-10 border-t border-dashed border-primary/40"
          style={{ bottom: `calc(${goalFraction} * 8rem + 1.875rem)` }}
          aria-hidden
        >
          <span className="absolute -top-2.5 right-0 rounded bg-card px-1 text-[10px] font-medium text-primary">
            {DAILY_GOAL_MINUTES}m goal
          </span>
        </div>

        <ul className="flex items-end gap-2 sm:gap-3" aria-label="Study minutes by day">
          {weeklyMinutes.map((minutes, dayIndex) => {
            const height = (minutes / maxMinutes) * 100;
            const isToday = dayIndex === today;
            const dayName = DAYS[dayIndex] ?? "";

            return (
              <li key={dayIndex} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="relative flex h-32 w-full items-end">
                  <div
                    className={cn(
                      "w-full rounded-t-md transition-[height] duration-500",
                      minutes === 0
                        ? "bg-secondary"
                        : isToday
                          ? "bg-primary"
                          : "bg-primary/45"
                    )}
                    style={{ height: `${Math.max(height, 4)}%` }}
                    title={`${dayName}: ${formatTime(minutes)}`}
                  />
                  <span className="sr-only">
                    {dayName}: {formatTime(minutes)}
                  </span>
                </div>
                <span
                  className={cn(
                    "h-6 text-xs leading-6",
                    isToday ? "font-semibold text-primary" : "text-muted-foreground"
                  )}
                  aria-hidden
                >
                  {dayName}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/** Loading skeleton for WeeklyProgress. */
export function WeeklyProgressSkeleton({ className }: { className?: string }) {
  const heights = [45, 70, 30, 55, 80, 40, 65];
  return (
    <div className={cn("space-y-5", className)} aria-hidden>
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
      </div>
      <div className="flex items-end gap-2 sm:gap-3">
        {heights.map((h, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex h-32 w-full items-end">
              <Skeleton className="w-full rounded-b-none rounded-t-md" style={{ height: `${h}%` }} />
            </div>
            <Skeleton className="h-3 w-6" />
          </div>
        ))}
      </div>
    </div>
  );
}
