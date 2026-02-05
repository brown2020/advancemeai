"use client";

import { useMemo } from "react";
import { cn } from "@/utils/cn";

interface StudyCalendarProps {
  /** Map of date string (YYYY-MM-DD) to study intensity (0-4) */
  studyData: Record<string, number>;
  /** Number of weeks to show (default: 13) */
  weeks?: number;
  className?: string;
}

/**
 * GitHub-style study calendar heatmap
 */
export function StudyCalendar({
  studyData,
  weeks = 13,
  className,
}: StudyCalendarProps) {
  const { days, monthLabels } = useMemo(() => {
    const today = new Date();
    const totalDays = weeks * 7;
    const days: { date: string; level: number; dayOfWeek: number }[] = [];
    const monthLabels: { month: string; startCol: number }[] = [];

    let lastMonth = -1;

    for (let i = totalDays - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split("T")[0]!;
      const dayOfWeek = date.getDay();
      const month = date.getMonth();

      // Track month labels
      if (month !== lastMonth) {
        const colIndex = Math.floor((totalDays - 1 - i) / 7);
        if (monthLabels.length === 0 || colIndex > (monthLabels.at(-1)?.startCol ?? -1)) {
          monthLabels.push({
            month: date.toLocaleString("default", { month: "short" }),
            startCol: colIndex,
          });
        }
        lastMonth = month;
      }

      days.push({
        date: dateStr,
        level: studyData[dateStr] ?? 0,
        dayOfWeek,
      });
    }

    return { days, monthLabels };
  }, [studyData, weeks]);

  // Group days by week
  const weeklyData = useMemo(() => {
    const result: (typeof days)[] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  }, [days]);

  const getLevelColor = (level: number) => {
    switch (level) {
      case 0:
        return "bg-muted";
      case 1:
        return "bg-green-200 dark:bg-green-900";
      case 2:
        return "bg-green-400 dark:bg-green-700";
      case 3:
        return "bg-green-500 dark:bg-green-500";
      case 4:
        return "bg-green-600 dark:bg-green-400";
      default:
        return "bg-green-700 dark:bg-green-300";
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Month labels */}
      <div className="flex text-xs text-muted-foreground pl-8">
        {monthLabels.map(({ month, startCol }, idx) => (
          <div
            key={`${month}-${startCol}`}
            style={{
              marginLeft: idx === 0 ? `${startCol * 14}px` : undefined,
              width: idx < monthLabels.length - 1
                ? `${((monthLabels[idx + 1]?.startCol ?? weeks) - startCol) * 14}px`
                : undefined,
            }}
          >
            {month}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex gap-0.5">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground pr-2">
          <span className="h-3" />
          <span className="h-3 leading-3">Mon</span>
          <span className="h-3" />
          <span className="h-3 leading-3">Wed</span>
          <span className="h-3" />
          <span className="h-3 leading-3">Fri</span>
          <span className="h-3" />
        </div>

        {/* Weeks */}
        {weeklyData.map((week, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-0.5">
            {week.map((day, _dayIdx) => (
              <div
                key={day.date}
                className={cn(
                  "w-3 h-3 rounded-sm transition-colors",
                  getLevelColor(day.level)
                )}
                title={`${day.date}: ${day.level > 0 ? `${day.level} study sessions` : "No study"}`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn("w-3 h-3 rounded-sm", getLevelColor(level))}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

interface StudyCalendarSkeletonProps {
  weeks?: number;
  className?: string;
}

/**
 * Loading skeleton for StudyCalendar
 */
export function StudyCalendarSkeleton({
  weeks = 13,
  className,
}: StudyCalendarSkeletonProps) {
  return (
    <div className={cn("space-y-2 animate-pulse", className)}>
      <div className="h-4 w-full bg-muted rounded" />
      <div className="flex gap-0.5">
        <div className="w-8" />
        {Array.from({ length: weeks }).map((_, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            {Array.from({ length: 7 }).map((_, j) => (
              <div key={j} className="w-3 h-3 rounded-sm bg-muted" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
