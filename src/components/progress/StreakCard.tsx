"use client";

import { Flame, Trophy, Calendar } from "lucide-react";
import { cn } from "@/utils/cn";

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: number | null;
  className?: string;
}

/**
 * Card displaying streak information
 */
export function StreakCard({
  currentStreak,
  longestStreak,
  lastStudyDate,
  className,
}: StreakCardProps) {
  const isActiveToday = lastStudyDate
    ? new Date(lastStudyDate).toDateString() === new Date().toDateString()
    : false;

  const getStreakMessage = () => {
    if (currentStreak === 0) return "Start studying to build your streak!";
    if (currentStreak === 1) return "Great start! Keep it going tomorrow.";
    if (currentStreak < 7) return `${7 - currentStreak} more days to reach a week!`;
    if (currentStreak < 30) return `You&apos;re on fire! ${30 - currentStreak} days to a month!`;
    return "Amazing dedication! Keep it up!";
  };

  return (
    <div className={cn("p-4 rounded-lg border bg-card", className)}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">
            Current Streak
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <Flame
              size={28}
              className={cn(
                "transition-colors",
                currentStreak > 0
                  ? "text-orange-500 fill-orange-500"
                  : "text-muted-foreground"
              )}
            />
            <span className="text-3xl font-bold">{currentStreak}</span>
            <span className="text-muted-foreground">
              day{currentStreak !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {isActiveToday && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Studied today
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground mt-2">{getStreakMessage()}</p>

      <div className="mt-4 pt-4 border-t flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-yellow-500" />
          <div>
            <p className="text-xs text-muted-foreground">Longest streak</p>
            <p className="font-semibold">
              {longestStreak} day{longestStreak !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Last studied</p>
            <p className="font-semibold">
              {lastStudyDate
                ? new Date(lastStudyDate).toLocaleDateString()
                : "Never"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for StreakCard
 */
export function StreakCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("p-4 rounded-lg border bg-card animate-pulse", className)}>
      <div className="h-4 w-24 bg-muted rounded mb-2" />
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-muted rounded" />
        <div className="h-8 w-12 bg-muted rounded" />
      </div>
      <div className="h-4 w-48 bg-muted rounded mt-3" />
      <div className="mt-4 pt-4 border-t flex gap-6">
        <div className="h-10 w-24 bg-muted rounded" />
        <div className="h-10 w-24 bg-muted rounded" />
      </div>
    </div>
  );
}
