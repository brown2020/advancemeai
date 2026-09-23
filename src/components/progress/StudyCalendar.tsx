"use client";

import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";

interface StudyCalendarProps {
  /** Map of date string (YYYY-MM-DD) to study intensity (0-4) */
  studyData: Record<string, number>;
  /** Number of weeks to show (default: 13) */
  weeks?: number;
  className?: string;
}

type CalendarDay = { date: string; level: number } | null;

/** Intensity steps use the brand color at increasing opacity. */
const LEVEL_CLASSES = [
  "bg-secondary",
  "bg-primary/20",
  "bg-primary/40",
  "bg-primary/70",
  "bg-primary",
] as const;

function levelClass(level: number): string {
  return LEVEL_CLASSES[Math.max(0, Math.min(4, level))] ?? LEVEL_CLASSES[0];
}

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

/** Cell size + gap in px; month labels are positioned in whole columns. */
const COLUMN_PX = 18;

function dateKey(date: Date): string {
  return date.toISOString().split("T")[0]!;
}

/**
 * GitHub-style study heatmap. Columns are Sun–Sat weeks ending with the
 * current week, so rows line up with the weekday labels.
 */
export function StudyCalendar({
  studyData,
  weeks = 13,
  className,
}: StudyCalendarProps) {
  const { columns, monthLabels, activeDays } = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay() - (weeks - 1) * 7);

    const columns: CalendarDay[][] = [];
    const monthLabels: { month: string; col: number }[] = [];
    let activeDays = 0;
    let lastMonth = -1;

    for (let col = 0; col < weeks; col++) {
      const week: CalendarDay[] = [];
      for (let row = 0; row < 7; row++) {
        const date = new Date(start);
        date.setDate(start.getDate() + col * 7 + row);
        if (date > today) {
          week.push(null);
          continue;
        }
        if (row === 0 && date.getMonth() !== lastMonth) {
          lastMonth = date.getMonth();
          // A partial first month would collide with the next label; drop it.
          const prev = monthLabels[monthLabels.length - 1];
          if (prev && col - prev.col < 3) monthLabels.pop();
          monthLabels.push({
            month: date.toLocaleString("default", { month: "short" }),
            col,
          });
        }
        const key = dateKey(date);
        const level = studyData[key] ?? 0;
        if (level > 0) activeDays++;
        week.push({ date: key, level });
      }
      columns.push(week);
    }

    return { columns, monthLabels, activeDays };
  }, [studyData, weeks]);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="overflow-x-auto scrollbar-none">
        <div className="inline-block min-w-max">
          {/* Month labels */}
          <div className="relative ml-9 h-4 text-xs text-muted-foreground" aria-hidden>
            {monthLabels.map(({ month, col }) => (
              <span
                key={`${month}-${col}`}
                className="absolute top-0"
                style={{ left: col * COLUMN_PX }}
              >
                {month}
              </span>
            ))}
          </div>

          <div
            className="mt-1 flex gap-1"
            role="img"
            aria-label={`Study activity heatmap: ${activeDays} active days in the last ${weeks} weeks`}
          >
            <div className="flex w-8 flex-col gap-1 text-[11px] text-muted-foreground" aria-hidden>
              {DAY_LABELS.map((label, i) => (
                <span key={i} className="flex h-3.5 items-center">
                  {label}
                </span>
              ))}
            </div>

            {columns.map((week, col) => (
              <div key={col} className="flex flex-col gap-1">
                {week.map((day, row) =>
                  day ? (
                    <div
                      key={day.date}
                      className={cn("size-3.5 rounded-[4px]", levelClass(day.level))}
                      title={`${day.date}: ${
                        day.level > 0 ? "Studied" : "No study"
                      }`}
                    />
                  ) : (
                    <div key={`empty-${row}`} className="size-3.5" />
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          <span className="font-semibold text-foreground tabular-nums">{activeDays}</span>{" "}
          active {activeDays === 1 ? "day" : "days"}
        </span>
        <div className="flex items-center gap-1.5" aria-hidden>
          <span>Less</span>
          {LEVEL_CLASSES.map((cls) => (
            <span key={cls} className={cn("size-3.5 rounded-[4px]", cls)} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

interface StudyCalendarSkeletonProps {
  weeks?: number;
  className?: string;
}

/** Loading skeleton for StudyCalendar. */
export function StudyCalendarSkeleton({
  weeks = 13,
  className,
}: StudyCalendarSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)} aria-hidden>
      <Skeleton className="ml-9 h-4 w-48" />
      <div className="flex gap-1">
        <div className="w-8" />
        {Array.from({ length: weeks }, (_, col) => (
          <div key={col} className="flex flex-col gap-1">
            {Array.from({ length: 7 }, (_, row) => (
              <Skeleton key={row} className="size-3.5 rounded-[4px]" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
