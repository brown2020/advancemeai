"use client";

import { Star } from "lucide-react";
import { cn } from "@/utils/cn";
import { getLevelProgress, getXPForLevel } from "@/types/gamification";

interface XPProgressProps {
  xp: number;
  level: number;
  size?: "sm" | "md" | "lg";
  showDetails?: boolean;
  className?: string;
}

/**
 * Displays XP progress bar with level indicator
 */
export function XPProgress({
  xp,
  level,
  size = "md",
  showDetails = true,
  className,
}: XPProgressProps) {
  const progress = getLevelProgress(xp);
  const currentLevelXP = getXPForLevel(level);
  const nextLevelXP = getXPForLevel(level + 1);
  const xpInLevel = xp - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;

  const sizeClasses = {
    sm: {
      container: "gap-1.5",
      icon: 14,
      text: "text-xs",
      bar: "h-1.5",
      level: "text-sm",
    },
    md: {
      container: "gap-2",
      icon: 18,
      text: "text-sm",
      bar: "h-2",
      level: "text-base",
    },
    lg: {
      container: "gap-3",
      icon: 24,
      text: "text-base",
      bar: "h-3",
      level: "text-lg",
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={cn("flex flex-col", sizes.container, className)}>
      {/* Level and XP header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <Star
              size={sizes.icon}
              className="text-yellow-500 fill-yellow-500"
            />
            <span
              className={cn(
                "absolute inset-0 flex items-center justify-center font-bold text-yellow-900",
                size === "sm" ? "text-[8px]" : size === "md" ? "text-[10px]" : "text-xs"
              )}
            >
              {level}
            </span>
          </div>
          <span className={cn("font-semibold", sizes.level)}>Level {level}</span>
        </div>
        {showDetails && (
          <span className={cn("text-muted-foreground", sizes.text)}>
            {xp.toLocaleString()} XP
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div
        className={cn(
          "w-full bg-secondary rounded-full overflow-hidden",
          sizes.bar
        )}
      >
        <div
          className={cn(
            "h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-500 ease-out rounded-full"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* XP details */}
      {showDetails && level < 50 && (
        <div className={cn("flex justify-between text-muted-foreground", sizes.text)}>
          <span>
            {xpInLevel.toLocaleString()} / {xpNeeded.toLocaleString()} XP
          </span>
          <span>{xpNeeded - xpInLevel} XP to next level</span>
        </div>
      )}
      {showDetails && level >= 50 && (
        <div className={cn("text-center text-yellow-500 font-medium", sizes.text)}>
          Max Level Reached!
        </div>
      )}
    </div>
  );
}

/**
 * Compact XP badge for header/nav
 */
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
        "flex items-center gap-1.5 px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
        className
      )}
    >
      <Star size={14} className="fill-current" />
      <span className="text-sm font-medium">{level}</span>
      <span className="text-xs text-muted-foreground">
        {xp.toLocaleString()} XP
      </span>
    </div>
  );
}
