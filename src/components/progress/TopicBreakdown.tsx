"use client";

import { cn } from "@/utils/cn";

interface TopicData {
  topic: string;
  correct: number;
  total: number;
}

interface TopicBreakdownProps {
  topics: TopicData[];
  className?: string;
}

/**
 * Breakdown of performance by topic/section
 */
export function TopicBreakdown({ topics, className }: TopicBreakdownProps) {
  // Sort by percentage (ascending, so weakest first)
  const sortedTopics = [...topics].sort((a, b) => {
    const percentA = a.total > 0 ? a.correct / a.total : 0;
    const percentB = b.total > 0 ? b.correct / b.total : 0;
    return percentA - percentB;
  });

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-blue-500";
    if (percentage >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  const getPerformanceLabel = (percentage: number) => {
    if (percentage >= 80) return "Excellent";
    if (percentage >= 60) return "Good";
    if (percentage >= 40) return "Needs Work";
    return "Focus Area";
  };

  if (topics.length === 0) {
    return (
      <div className={cn("text-center py-8 text-muted-foreground", className)}>
        <p>No topic data yet</p>
        <p className="text-sm mt-1">Complete some practice questions to see your breakdown</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {sortedTopics.map((topic, idx) => {
        const percentage = topic.total > 0
          ? Math.round((topic.correct / topic.total) * 100)
          : 0;

        return (
          <div key={topic.topic} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{topic.topic}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  {topic.correct}/{topic.total}
                </span>
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded text-xs font-medium",
                    percentage >= 80
                      ? "bg-green-500/10 text-green-600 dark:text-green-400"
                      : percentage >= 60
                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      : percentage >= 40
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "bg-red-500/10 text-red-600 dark:text-red-400"
                  )}
                >
                  {percentage}%
                </span>
              </div>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-500",
                  getPerformanceColor(percentage)
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}

      {/* Focus recommendation */}
      {sortedTopics.length > 0 && sortedTopics[0] && sortedTopics[0].total > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
            💡 Focus Area: {sortedTopics[0].topic}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Practice more {sortedTopics[0].topic.toLowerCase()} questions to improve your score
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Loading skeleton for TopicBreakdown
 */
export function TopicBreakdownSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3 animate-pulse", className)}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-1">
          <div className="flex justify-between">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-4 w-16 bg-muted rounded" />
          </div>
          <div className="h-2 w-full bg-muted rounded-full" />
        </div>
      ))}
    </div>
  );
}
