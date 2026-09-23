"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BookOpenCheck,
  Lightbulb,
  Sparkles,
  Timer,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PageContainer,
  PageHeader,
  SectionContainer,
} from "@/components/common/UIComponents";
import type { PracticeMode } from "@/api/firebase/practiceProgressRepository";
import type { AdaptiveRecommendation } from "@/services/adaptivePracticeService";
import { ROUTES } from "@/constants/appConstants";
import { cn } from "@/utils/cn";

const QUESTION_COUNTS = [1, 3, 5, 10, 15, 20] as const;

const PRACTICE_MODES: Array<{
  value: PracticeMode;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    value: "timed",
    label: "Timed",
    description: "Simulate exam pacing with a countdown timer.",
    icon: Timer,
  },
  {
    value: "review",
    label: "Review",
    description: "Move at your own pace with explanations.",
    icon: BookOpenCheck,
  },
  {
    value: "micro",
    label: "Micro lesson",
    description: "Short bursts plus focused skill tips.",
    icon: Lightbulb,
  },
];

const choiceClass =
  "rounded-xl border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

type PracticeSetupProps = {
  sectionTitle: string;
  selectedCount: number;
  onCountChange: (count: number) => void;
  practiceMode: PracticeMode;
  onModeChange: (mode: PracticeMode) => void;
  recommendation: AdaptiveRecommendation | null;
  onStart: () => void;
};

/** Pre-practice screen: pick question count and practice mode. */
export function PracticeSetup({
  sectionTitle,
  selectedCount,
  onCountChange,
  practiceMode,
  onModeChange,
  recommendation,
  onStart,
}: PracticeSetupProps) {
  return (
    <PageContainer width="narrow">
      <Link
        href={ROUTES.PRACTICE.INDEX}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        SAT Prep
      </Link>
      <PageHeader
        eyebrow="AI-generated practice"
        title={sectionTitle}
        description="Fresh questions tuned to your level. Pick how many and how you want to practice."
      />

      {recommendation && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-primary/20 bg-accent p-4 text-sm text-accent-foreground">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="font-semibold">Adaptive suggestion</p>
            <p className="mt-0.5">
              Try {recommendation.recommendedCount} {sectionTitle.toLowerCase()}{" "}
              questions focusing on{" "}
              {recommendation.focusConcepts.join(", ") || "core skills"} at{" "}
              {recommendation.suggestedDifficulty} difficulty.
            </p>
          </div>
        </div>
      )}

      <SectionContainer title="How many questions?">
        <div
          role="radiogroup"
          aria-label="Number of questions"
          className="grid grid-cols-3 gap-2 sm:grid-cols-6"
        >
          {QUESTION_COUNTS.map((count) => {
            const active = selectedCount === count;
            return (
              <button
                key={count}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onCountChange(count)}
                className={cn(
                  choiceClass,
                  "flex h-14 flex-col items-center justify-center",
                  active
                    ? "border-primary bg-accent text-accent-foreground"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                <span className="text-lg font-bold tabular-nums leading-none">
                  {count}
                </span>
                <span className="mt-1 text-[11px] text-muted-foreground">
                  {count === 1 ? "question" : "questions"}
                </span>
              </button>
            );
          })}
        </div>
      </SectionContainer>

      <SectionContainer title="Practice mode">
        <div
          role="radiogroup"
          aria-label="Practice mode"
          className="grid gap-3 sm:grid-cols-3"
        >
          {PRACTICE_MODES.map((mode) => {
            const active = practiceMode === mode.value;
            const Icon = mode.icon;
            return (
              <button
                key={mode.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onModeChange(mode.value)}
                className={cn(
                  choiceClass,
                  "flex items-start gap-3 p-4 text-left sm:flex-col",
                  active
                    ? "border-primary bg-accent"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                </span>
                <span>
                  <span className="block font-semibold">{mode.label}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">
                    {mode.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </SectionContainer>

      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          AI-generated questions may take a moment. More questions take longer.
        </p>
        <Button size="lg" onClick={onStart}>
          <Sparkles aria-hidden />
          Start practice
        </Button>
      </div>
    </PageContainer>
  );
}
