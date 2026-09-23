"use client";

import { Flame } from "lucide-react";
import { cn } from "@/utils/cn";

interface StreakCounterProps {
  streak: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  sm: { root: "text-sm gap-1", icon: "size-3.5" },
  md: { root: "text-base gap-1.5", icon: "size-[18px]" },
  lg: { root: "text-lg gap-2", icon: "size-6" },
} as const;

/** Current study streak with a flame icon. */
export function StreakCounter({
  streak,
  size = "md",
  showLabel = true,
  className,
}: StreakCounterProps) {
  const isActive = streak > 0;
  const sizes = SIZE_CLASSES[size];
  const dayLabel = streak === 1 ? "day" : "days";

  return (
    <div
      className={cn(
        "inline-flex items-center font-medium tabular-nums",
        sizes.root,
        isActive ? "text-streak" : "text-muted-foreground",
        className
      )}
      aria-label={`${streak} ${dayLabel} streak`}
      title={`${streak} ${dayLabel} streak`}
    >
      <Flame
        className={cn(sizes.icon, "shrink-0", isActive && "fill-current")}
        aria-hidden
      />
      <span className="font-bold" aria-hidden>
        {streak}
      </span>
      {showLabel && (
        <span className="font-normal text-muted-foreground" aria-hidden>
          {dayLabel}
        </span>
      )}
    </div>
  );
}
