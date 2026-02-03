"use client";

import { cn } from "@/utils/cn";

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
}

export function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 8,
  className,
  showLabel = true,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  // Color based on progress
  const getColor = () => {
    if (progress >= 80) return "text-green-500";
    if (progress >= 50) return "text-yellow-500";
    if (progress >= 25) return "text-orange-500";
    return "text-muted-foreground";
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all duration-500 ease-out", getColor())}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold">{Math.round(progress)}%</span>
        </div>
      )}
    </div>
  );
}

interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ProgressBar({
  progress,
  className,
  showLabel = true,
  size = "md",
}: ProgressBarProps) {
  const heights = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4",
  };

  // Color based on progress
  const getColor = () => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 50) return "bg-yellow-500";
    if (progress >= 25) return "bg-orange-500";
    return "bg-muted-foreground";
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
      )}
      <div className={cn("w-full bg-muted rounded-full overflow-hidden", heights[size])}>
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", getColor())}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
