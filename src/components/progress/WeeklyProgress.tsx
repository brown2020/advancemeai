"use client";

import { useMemo } from "react";
import { cn } from "@/utils/cn";

interface WeeklyProgressProps {
  /** Array of study minutes for each day of the week (Sun-Sat) */
  weeklyMinutes: number[];
  className?: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Bar chart showing weekly study progress
 */
export function WeeklyProgress({ weeklyMinutes, className }: WeeklyProgressProps) {
  const { maxMinutes, totalMinutes, averageMinutes } = useMemo(() => {
    const max = Math.max(...weeklyMinutes, 60); // At least 60 minutes for scale
    const total = weeklyMinutes.reduce((a, b) => a + b, 0);
    const average = Math.round(total / 7);
    return { maxMinutes: max, totalMinutes: total, averageMinutes: average };
  }, [weeklyMinutes]);

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const today = new Date().getDay();

  return (
    <div className={cn("space-y-4", className)}>
      {/* Summary */}
      <div className="flex items-center justify-between text-sm">
        <div>
          <span className="text-muted-foreground">Total this week: </span>
          <span className="font-semibold">{formatTime(totalMinutes)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Daily average: </span>
          <span className="font-semibold">{formatTime(averageMinutes)}</span>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-2 h-32">
        {weeklyMinutes.map((minutes, idx) => {
          const height = (minutes / maxMinutes) * 100;
          const isToday = idx === today;

          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
              {/* Bar */}
              <div className="relative w-full flex-1 flex items-end">
                <div
                  className={cn(
                    "w-full rounded-t-sm transition-all duration-300",
                    isToday
                      ? "bg-primary"
                      : minutes > 0
                      ? "bg-primary/60"
                      : "bg-muted"
                  )}
                  style={{ height: `${Math.max(height, 4)}%` }}
                />
                {minutes > 0 && (
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap">
                    {formatTime(minutes)}
                  </span>
                )}
              </div>
              {/* Label */}
              <span
                className={cn(
                  "text-xs",
                  isToday ? "font-semibold text-primary" : "text-muted-foreground"
                )}
              >
                {DAYS[idx]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Goal indicator */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="flex-1 h-px bg-border" />
        <span>30 min/day goal</span>
        <div className="flex-1 h-px bg-border" />
      </div>
    </div>
  );
}

/**
 * Loading skeleton for WeeklyProgress
 */
export function WeeklyProgressSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4 animate-pulse", className)}>
      <div className="flex justify-between">
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="h-4 w-28 bg-muted rounded" />
      </div>
      <div className="flex items-end gap-2 h-32">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full bg-muted rounded-t-sm"
              style={{ height: `${20 + Math.random() * 60}%` }}
            />
            <div className="h-3 w-6 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
