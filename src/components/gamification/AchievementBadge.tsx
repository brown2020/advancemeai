"use client";

import {
  Award,
  Flame,
  Footprints,
  GraduationCap,
  Layers,
  Lock,
  Moon,
  Sun,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Progress } from "@/components/ui/progress";
import type { AchievementId } from "@/types/gamification";
import { getAchievementById, ACHIEVEMENTS } from "@/types/gamification";

/** Icons referenced by name in ACHIEVEMENTS (explicit map keeps the bundle small). */
const ACHIEVEMENT_ICONS: Record<string, LucideIcon> = {
  Award,
  Flame,
  Footprints,
  GraduationCap,
  Layers,
  Moon,
  Sun,
  Trophy,
  Zap,
};

type BadgeSize = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<BadgeSize, { container: string; icon: string; text: string }> = {
  sm: { container: "size-11 rounded-xl", icon: "size-5", text: "text-xs" },
  md: { container: "size-14 rounded-2xl", icon: "size-6", text: "text-sm" },
  lg: { container: "size-20 rounded-3xl", icon: "size-8", text: "text-base" },
};

interface AchievementBadgeProps {
  achievementId: AchievementId;
  unlocked?: boolean;
  unlockedAt?: number;
  size?: BadgeSize;
  showDetails?: boolean;
  className?: string;
}

/** A single achievement: icon tile plus optional name/description. */
function AchievementBadge({
  achievementId,
  unlocked = false,
  unlockedAt,
  size = "md",
  showDetails = false,
  className,
}: AchievementBadgeProps) {
  const achievement = getAchievementById(achievementId);
  if (!achievement) return null;

  const Icon = ACHIEVEMENT_ICONS[achievement.icon] ?? Award;
  const sizes = SIZE_CLASSES[size];

  return (
    <div
      className={cn("flex flex-col items-center gap-2 text-center", className)}
      title={`${achievement.name}: ${achievement.description}`}
    >
      <div
        className={cn(
          "relative flex items-center justify-center transition-colors",
          sizes.container,
          unlocked
            ? "bg-primary text-primary-foreground shadow-card"
            : "border border-dashed border-border bg-secondary text-muted-foreground"
        )}
      >
        <Icon className={cn(sizes.icon, !unlocked && "opacity-50")} aria-hidden />
        {!unlocked && (
          <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
            <Lock className="size-3" aria-hidden />
          </span>
        )}
      </div>

      {showDetails && (
        <div className="min-w-0">
          <p className={cn("font-medium leading-tight", sizes.text, !unlocked && "text-muted-foreground")}>
            {achievement.name}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{achievement.description}</p>
          {unlocked && unlockedAt && (
            <p className="mt-1 text-xs text-success">
              Unlocked {new Date(unlockedAt).toLocaleDateString()}
            </p>
          )}
          {!unlocked && (
            <p className="mt-1 text-xs font-medium text-primary">
              +{achievement.xpReward} XP
            </p>
          )}
          <span className="sr-only">{unlocked ? "Unlocked" : "Locked"}</span>
        </div>
      )}
    </div>
  );
}

interface AchievementsGridProps {
  unlockedIds: AchievementId[];
  achievementDates?: Partial<Record<AchievementId, number>>;
  showLocked?: boolean;
  size?: BadgeSize;
  className?: string;
}

const GRID_COLS: Record<BadgeSize, string> = {
  sm: "grid-cols-3 sm:grid-cols-4 lg:grid-cols-5",
  md: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  lg: "grid-cols-2 sm:grid-cols-3",
};

/** Grid of all (or only unlocked) achievements. */
export function AchievementsGrid({
  unlockedIds,
  achievementDates = {},
  showLocked = true,
  size = "md",
  className,
}: AchievementsGridProps) {
  const achievements = showLocked
    ? ACHIEVEMENTS
    : ACHIEVEMENTS.filter((a) => unlockedIds.includes(a.id));

  return (
    <div className={cn("grid gap-x-3 gap-y-5", GRID_COLS[size], className)}>
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

/** "N / total" summary with a progress bar. */
export function AchievementProgress({
  unlockedCount,
  totalCount = ACHIEVEMENTS.length,
  className,
}: AchievementProgressProps) {
  const progress = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Unlocked</span>
        <span className="tabular-nums text-muted-foreground">
          {unlockedCount} / {totalCount}
        </span>
      </div>
      <Progress value={progress} label="Achievements unlocked" />
    </div>
  );
}
