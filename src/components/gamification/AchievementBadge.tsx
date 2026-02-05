"use client";

import * as LucideIcons from "lucide-react";
import { cn } from "@/utils/cn";
import type { AchievementId } from "@/types/gamification";
import { getAchievementById, ACHIEVEMENTS } from "@/types/gamification";

interface AchievementBadgeProps {
  achievementId: AchievementId;
  unlocked?: boolean;
  unlockedAt?: number;
  size?: "sm" | "md" | "lg";
  showDetails?: boolean;
  className?: string;
}

/**
 * Displays a single achievement badge
 */
export function AchievementBadge({
  achievementId,
  unlocked = false,
  unlockedAt,
  size = "md",
  showDetails = false,
  className,
}: AchievementBadgeProps) {
  const achievement = getAchievementById(achievementId);
  if (!achievement) return null;

  // Get the icon component dynamically
  const IconComponent = (LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>)[
    achievement.icon
  ] ?? LucideIcons.Award;

  const sizeClasses = {
    sm: {
      container: "w-10 h-10",
      icon: 18,
      text: "text-xs",
    },
    md: {
      container: "w-14 h-14",
      icon: 24,
      text: "text-sm",
    },
    lg: {
      container: "w-20 h-20",
      icon: 32,
      text: "text-base",
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div
        className={cn(
          "rounded-full flex items-center justify-center transition-all",
          sizes.container,
          unlocked
            ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-lg shadow-yellow-500/25"
            : "bg-muted text-muted-foreground opacity-50"
        )}
      >
        <IconComponent size={sizes.icon} />
      </div>

      {showDetails && (
        <div className="text-center">
          <p className={cn("font-medium", sizes.text)}>{achievement.name}</p>
          <p className={cn("text-muted-foreground", sizes.text, "text-xs")}>
            {achievement.description}
          </p>
          {unlocked && unlockedAt && (
            <p className="text-xs text-muted-foreground mt-1">
              Unlocked {new Date(unlockedAt).toLocaleDateString()}
            </p>
          )}
          {!unlocked && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
              +{achievement.xpReward} XP
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface AchievementsGridProps {
  unlockedIds: AchievementId[];
  achievementDates?: Record<AchievementId, number>;
  showLocked?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Grid display of all achievements
 */
export function AchievementsGrid({
  unlockedIds,
  achievementDates = {} as Record<AchievementId, number>,
  showLocked = true,
  size = "md",
  className,
}: AchievementsGridProps) {
  const achievements = showLocked
    ? ACHIEVEMENTS
    : ACHIEVEMENTS.filter((a) => unlockedIds.includes(a.id));

  return (
    <div
      className={cn(
        "grid gap-4",
        size === "sm" ? "grid-cols-5" : size === "md" ? "grid-cols-4" : "grid-cols-3",
        className
      )}
    >
      {achievements.map((achievement) => (
        <AchievementBadge
          key={achievement.id}
          achievementId={achievement.id}
          unlocked={unlockedIds.includes(achievement.id)}
          unlockedAt={achievementDates[achievement.id]}
          size={size}
          showDetails
        />
      ))}
    </div>
  );
}

interface AchievementProgressProps {
  unlockedCount: number;
  totalCount?: number;
  className?: string;
}

/**
 * Achievement progress summary
 */
export function AchievementProgress({
  unlockedCount,
  totalCount = ACHIEVEMENTS.length,
  className,
}: AchievementProgressProps) {
  const progress = (unlockedCount / totalCount) * 100;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium">Achievements</span>
        <span className="text-muted-foreground">
          {unlockedCount} / {totalCount}
        </span>
      </div>
      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
