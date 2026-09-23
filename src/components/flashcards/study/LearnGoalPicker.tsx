"use client";

import { Brain, PartyPopper, RotateCcw, Target, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StreakCounter, XPBadge } from "@/components/gamification";
import { cn } from "@/utils/cn";

export type LearnGoal =
  | { type: "all" }
  | { type: "count"; value: number };

type GoalOption = {
  goal: LearnGoal;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  minUnmastered: number;
};

function goalOptions(unmasteredCount: number): GoalOption[] {
  return [
    {
      goal: { type: "all" },
      label: "Master all",
      description: `Study all ${unmasteredCount} unmastered terms`,
      icon: Trophy,
      minUnmastered: 1,
    },
    {
      goal: { type: "count", value: 5 },
      label: "Quick session",
      description: "Master 5 terms",
      icon: Zap,
      minUnmastered: 5,
    },
    {
      goal: { type: "count", value: 10 },
      label: "Standard session",
      description: "Master 10 terms",
      icon: Target,
      minUnmastered: 10,
    },
    {
      goal: { type: "count", value: 20 },
      label: "Deep dive",
      description: "Master 20 terms",
      icon: Brain,
      minUnmastered: 20,
    },
  ];
}

type LearnGoalPickerProps = {
  unmasteredCount: number;
  learnedCount: number;
  totalCount: number;
  rewards: { xp: number; level: number; streak: number };
  onStart: (goal: LearnGoal) => void;
  onResetProgress?: () => void;
};

/** First Learn screen: pick how many terms to master this session. */
export function LearnGoalPicker({
  unmasteredCount,
  learnedCount,
  totalCount,
  rewards,
  onStart,
  onResetProgress,
}: LearnGoalPickerProps) {
  const allMastered = unmasteredCount === 0;

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-8">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
          {allMastered ? "Everything mastered" : "Set your learning goal"}
        </h2>
        <p className="mt-1.5 text-muted-foreground">
          {allMastered
            ? "You've mastered every term in this set."
            : `You have ${unmasteredCount} terms left to master. How many do you want to tackle?`}
        </p>
      </div>

      {allMastered ? (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-success/10 text-success">
            <PartyPopper className="size-7" aria-hidden />
          </div>
          <p className="text-sm text-muted-foreground">
            Reset your progress to learn the set again from scratch.
          </p>
          {onResetProgress ? (
            <Button type="button" variant="outline" onClick={onResetProgress}>
              <RotateCcw aria-hidden />
              Reset progress
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {goalOptions(unmasteredCount).map((option) => {
            const disabled = unmasteredCount < option.minUnmastered;
            const Icon = option.icon;
            return (
              <button
                key={option.label}
                type="button"
                disabled={disabled}
                onClick={() => onStart(option.goal)}
                className={cn(
                  "flex min-h-16 items-start gap-3 rounded-2xl border-2 border-border bg-card p-4 text-left transition-colors",
                  "hover:border-primary/50 hover:bg-accent/50",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:bg-card"
                )}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                  <Icon className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold">{option.label}</span>
                  <span className="block text-sm text-muted-foreground">
                    {disabled && option.goal.type === "count"
                      ? `Needs at least ${option.goal.value} unmastered terms`
                      : option.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm text-muted-foreground">
        <span className="tabular-nums">
          Mastered {learnedCount}/{totalCount}
        </span>
        <div className="flex items-center gap-3">
          <StreakCounter streak={rewards.streak} size="sm" showLabel={false} />
          <XPBadge xp={rewards.xp} level={rewards.level} />
        </div>
      </div>
    </section>
  );
}
