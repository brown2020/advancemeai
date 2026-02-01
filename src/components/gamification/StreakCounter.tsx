"use client";

import { Flame } from "lucide-react";
import { cn } from "@/utils/cn";

interface StreakCounterProps {
  streak: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

/**
 * Displays current study streak with flame icon
 */
export function StreakCounter({
  streak,
  size = "md",
  showLabel = true,
  className,
}: StreakCounterProps) {
  const isActive = streak > 0;

  const sizeClasses = {
    sm: "text-sm gap-1",
    md: "text-base gap-1.5",
    lg: "text-lg gap-2",
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 24,
  };

  return (
    <div
      className={cn(
        "flex items-center font-medium",
        sizeClasses[size],
        isActive ? "text-orange-500" : "text-muted-foreground",
        className
      )}
    >
      <Flame
        size={iconSizes[size]}
        className={cn(
          "transition-all",
          isActive && "fill-orange-500 animate-pulse"
        )}
      />
      <span className="font-bold">{streak}</span>
      {showLabel && (
        <span className="text-muted-foreground font-normal">
          {streak === 1 ? "day" : "days"}
        </span>
      )}
    </div>
  );
}
