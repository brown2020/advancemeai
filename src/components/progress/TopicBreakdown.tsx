"use client";

import Link from "next/link";
import { BarChart3, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button-variants";
import { ROUTES } from "@/constants/appConstants";
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

function percentOf(topic: TopicData): number {
  return topic.total > 0 ? Math.round((topic.correct / topic.total) * 100) : 0;
}

function tone(percentage: number) {
  if (percentage >= 80) return { bar: "bg-success", text: "text-success", label: "Strong" };
  if (percentage >= 60) return { bar: "bg-primary", text: "text-primary", label: "Good" };
  if (percentage >= 40) return { bar: "bg-warning", text: "text-warning", label: "Fair" };
  return { bar: "bg-destructive", text: "text-destructive", label: "Needs work" };
}

/** Practice accuracy per topic, weakest first, with a focus suggestion. */
export function TopicBreakdown({ topics, className }: TopicBreakdownProps) {
  const sortedTopics = [...topics].sort((a, b) => percentOf(a) - percentOf(b));
  const focus = sortedTopics[0];

  if (topics.length === 0) {
    return (
      <div className={cn("flex flex-col items-center py-8 text-center", className)}>
        <span className="mb-3 flex size-10 items-center justify-center rounded-xl bg-accent text-primary">
          <BarChart3 className="size-5" aria-hidden />
        </span>
        <p className="font-medium">No topic data yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Answer some practice questions to see your breakdown.
        </p>
        <Link
          href={ROUTES.PRACTICE.INDEX}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}
        >
          Start practicing
        </Link>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <ul className="space-y-4">
        {sortedTopics.map((topic) => {
          const percentage = percentOf(topic);
          const t = tone(percentage);
          return (
            <li key={topic.topic} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-medium">{topic.topic}</span>
                <span className="flex shrink-0 items-center gap-2 tabular-nums">
                  <span className="text-xs text-muted-foreground">
                    {topic.correct}/{topic.total}
                  </span>
                  <span className={cn("font-semibold", t.text)}>{percentage}%</span>
                  <span className="sr-only">({t.label})</span>
                </span>
              </div>
              <Progress
                value={percentage}
                indicatorClassName={t.bar}
                label={`${topic.topic}: ${percentage}% correct`}
              />
            </li>
          );
        })}
      </ul>

      {focus && focus.total > 0 && (
        <div className="flex gap-3 rounded-xl border border-warning/25 bg-warning/10 p-3">
          <Target className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
          <div>
            <p className="text-sm font-semibold">Focus area: {focus.topic}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Practice more {focus.topic.toLowerCase()} questions to raise your score.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/** Loading skeleton for TopicBreakdown. */
export function TopicBreakdownSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)} aria-hidden>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="space-y-1.5">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}
