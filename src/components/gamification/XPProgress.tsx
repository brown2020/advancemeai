"use client";

import { Star } from "lucide-react";
import { cn } from "@/utils/cn";
import {
  getLevelFromXP,
  getLevelProgress,
  getXPForLevel,
} from "@/types/gamification";

const MAX_LEVEL = 50;

interface XPProgressProps {
  xp: number;
  size?: "sm" | "md" | "lg";
  showDetails?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  sm: { container: "gap-1.5", chip: "size-5 text-[10px] rounded-md", text: "text-xs", bar: "h-1.5", level: "text-sm" },
  md: { container: "gap-2", chip: "size-6 text-xs rounded-lg", text: "text-sm", bar: "h-2", level: "text-base" },
  lg: { container: "gap-3", chip: "size-8 text-sm rounded-lg", text: "text-base", bar: "h-3", level: "text-lg" },
} as const;

/** Level chip + XP bar toward the next level. */
export function XPProgress({
  xp,
  size = "md",
  showDetails = true,
  className,
}: XPProgressProps) {
  // Derived from XP so a stale stored level can't produce negative progress.
  const level = getLevelFromXP(xp);
  const progress = Math.max(0, Math.min(100, getLevelProgress(xp)));
  const currentLevelXP = getXPForLevel(level);
  const nextLevelXP = getXPForLevel(level + 1);
  const xpInLevel = xp - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;
  const sizes = SIZE_CLASSES[size];
  const isMax = level >= MAX_LEVEL;

  return (
    <div className={cn("flex flex-col", sizes.container, className)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex shrink-0 items-center justify-center bg-primary font-bold tabular-nums text-primary-foreground",
              sizes.chip
            )}
            aria-hidden
          >
            {level}
          </span>
          <span className={cn("font-semibold", sizes.level)}>Level {level}</span>
        </div>
        {showDetails && (
          <span className={cn("tabular-nums text-muted-foreground", sizes.text)}>
            {xp.toLocaleString()} XP
          </span>
        )}
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        aria-label={`Level ${level} progress`}
        className={cn("w-full overflow-hidden rounded-full bg-secondary", sizes.bar)}
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {showDetails && !isMax && (
        <div className={cn("flex justify-between gap-2 tabular-nums text-muted-foreground", sizes.text)}>
          <span>
            {xpInLevel.toLocaleString()} / {xpNeeded.toLocaleString()} XP
          </span>
          <span>{(xpNeeded - xpInLevel).toLocaleString()} XP to next level</span>
        </div>
      )}
      {showDetails && isMax && (
        <p className={cn("text-center font-medium text-primary", sizes.text)}>
          Max level reached!
        </p>
      )}
    </div>
  );
}

/** Compact level + XP pill for toolbars and results. */
export function XPBadge({
  xp,
  level,
  className,
}: {
  xp: number;
  level: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-primary tabular-nums",
        className
      )}
      aria-label={`Level ${level}, ${xp.toLocaleString()} XP`}
    >
      <Star className="size-3.5 fill-current" aria-hidden />
      <span className="text-sm font-semibold" aria-hidden>
        {level}
      </span>
      <span className="text-xs text-muted-foreground" aria-hidden>
        {xp.toLocaleString()} XP
      </span>
    </div>
  );
}
