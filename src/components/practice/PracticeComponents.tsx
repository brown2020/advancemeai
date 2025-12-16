"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { PracticeMode } from "@/api/firebase/practiceProgressRepository";
import { AdaptiveRecommendation } from "@/services/adaptivePracticeService";
import { SECTION_TITLES } from "@/constants/appConstants";
import { cn } from "@/utils/cn";

/**
 * Practice mode configuration
 */
export const PRACTICE_MODES: Array<{
  value: PracticeMode;
  label: string;
  description: string;
}> = [
  {
    value: "timed",
    label: "Timed",
    description: "Simulate exam pacing with a countdown timer.",
  },
  {
    value: "review",
    label: "Review",
    description: "Move at your own pace with explanations.",
  },
  {
    value: "micro",
    label: "Micro Lesson",
    description: "Short bursts plus focused skill tips.",
  },
];

/**
 * Micro lesson tips by section
 */
export const MICRO_LESSONS: Record<string, string[]> = {
  writing: [
    "Remember: independent clauses joined by a comma need a conjunction or semicolon.",
    "Parallel structure matters—ensure each list item uses the same grammatical form.",
    "Modifiers go next to what they modify; misplaced phrases cause ambiguity.",
  ],
  reading: [
    "Scan for line references before reading answer choices to ground your evidence.",
    "Tone words in questions hint at whether the correct answer is positive or critical.",
  ],
  "math-no-calc": [
    "Look for opportunities to factor or use substitution before expanding expressions.",
    "Translate word problems into equations step by step; define variables clearly.",
  ],
  "math-calc": [
    "Graphing in your head? Plot intercepts and vertex to understand the curve quickly.",
    "Units matter—convert before applying formulas to avoid scaling mistakes.",
  ],
};

// Re-export SECTION_TITLES for backward compatibility
export { SECTION_TITLES };

interface TimerDisplayProps {
  formattedTimer: string | null;
}

/**
 * Timer display for timed practice mode
 */
export const TimerDisplay = React.memo(
  ({ formattedTimer }: TimerDisplayProps) => {
    if (!formattedTimer) return null;

    return (
      <div className="rounded-md bg-slate-900 p-3 text-center text-white">
        Time remaining: {formattedTimer}
      </div>
    );
  }
);
TimerDisplay.displayName = "TimerDisplay";

interface MicroLessonTipProps {
  tip: string | null;
}

/**
 * Micro lesson tip display
 */
export const MicroLessonTip = React.memo(({ tip }: MicroLessonTipProps) => {
  if (!tip) return null;

  return (
    <div className="rounded-md border-l-4 border-emerald-500 bg-emerald-50 p-3 text-sm text-emerald-900">
      Micro-lesson: {tip}
    </div>
  );
});
MicroLessonTip.displayName = "MicroLessonTip";

interface QuestionCountSelectorProps {
  selectedCount: number;
  onCountChange: (count: number) => void;
  practiceMode: PracticeMode;
  onModeChange: (mode: PracticeMode) => void;
  sectionTitle: string;
  recommendation: AdaptiveRecommendation | null;
  onStart: () => void;
}

/**
 * Question count and mode selector
 */
export const QuestionCountSelector = React.memo(
  ({
    selectedCount,
    onCountChange,
    practiceMode,
    onModeChange,
    sectionTitle,
    recommendation,
    onStart,
  }: QuestionCountSelectorProps) => (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>AI-Generated Practice Questions</CardTitle>
      </CardHeader>
      <CardContent>
        {recommendation && (
          <div className="mb-4 rounded-md border border-border bg-muted/50 p-4 text-sm">
            <p className="font-semibold">Adaptive suggestion</p>
            <p>
              Try {recommendation.recommendedCount} {sectionTitle.toLowerCase()}{" "}
              questions focusing on{" "}
              {recommendation.focusConcepts.join(", ") || "core skills"} at{" "}
              {recommendation.suggestedDifficulty} difficulty.
            </p>
          </div>
        )}
        <p className="mb-6">
          You&apos;re about to start the <strong>{sectionTitle}</strong>{" "}
          practice test. Our AI will generate custom questions for you to
          practice with.
        </p>

        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">
            How many questions would you like?
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[3, 5, 10, 15, 20].map((count) => (
              <button
                key={count}
                onClick={() => onCountChange(count)}
                className={cn(
                  "rounded-md border px-3 py-2 text-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  selectedCount === count
                    ? "border-ring bg-accent text-accent-foreground"
                    : "border-border bg-background hover:bg-muted/50"
                )}
              >
                {count} Questions
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">
            Choose your practice mode
          </h3>
          <div className="flex flex-wrap gap-3">
            {PRACTICE_MODES.map((mode) => (
              <button
                key={mode.value}
                onClick={() => onModeChange(mode.value)}
                className={cn(
                  "flex-1 rounded-md border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  practiceMode === mode.value
                    ? "border-ring bg-accent"
                    : "border-border bg-background hover:bg-muted/50"
                )}
              >
                <p className="font-semibold capitalize">{mode.label}</p>
                <p className="text-sm text-muted-foreground">
                  {mode.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-border bg-muted/50 p-4 mb-6">
          <p className="text-muted-foreground text-sm">
            <strong>Note:</strong> AI-generated questions may take a moment to
            create. The more questions you select, the longer it will take.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={onStart} className="w-full">
          Generate Questions & Start Practice
        </Button>
      </CardFooter>
    </Card>
  )
);
QuestionCountSelector.displayName = "QuestionCountSelector";

interface GeneratingQuestionsCardProps {
  selectedCount: number;
  sectionTitle: string;
}

/**
 * Loading state while generating questions
 */
export const GeneratingQuestionsCard = React.memo(
  ({ selectedCount, sectionTitle }: GeneratingQuestionsCardProps) => (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Generating Your Practice Questions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-lg font-medium mb-2">
          AI is creating your questions...
        </p>
        <p className="text-muted-foreground text-center max-w-md">
          Our AI is generating {selectedCount} custom {sectionTitle} questions
          for you. This may take a moment.
        </p>
      </CardContent>
    </Card>
  )
);
GeneratingQuestionsCard.displayName = "GeneratingQuestionsCard";

/**
 * Loading skeleton for questions
 */
export const QuestionLoadingSkeleton = React.memo(() => (
  <Card className="w-full max-w-3xl mx-auto">
    <CardHeader>
      <CardTitle>
        <Skeleton className="h-8 w-3/4" />
      </CardTitle>
    </CardHeader>
    <CardContent>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-3/4" />
      <div className="mt-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </CardContent>
  </Card>
));
QuestionLoadingSkeleton.displayName = "QuestionLoadingSkeleton";

interface ErrorCardProps {
  message: string;
}

/**
 * Error state card
 */
export const ErrorCard = React.memo(({ message }: ErrorCardProps) => (
  <Card className="w-full max-w-3xl mx-auto">
    <CardContent className="pt-6">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    </CardContent>
  </Card>
));
ErrorCard.displayName = "ErrorCard";

interface ReadingPassageCardProps {
  passage: string;
}

/**
 * Reading passage display card
 */
export const ReadingPassageCard = React.memo(
  ({ passage }: ReadingPassageCardProps) => (
    <Card className="w-full max-w-3xl mx-auto mb-6">
      <CardHeader>
        <CardTitle>Reading Passage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-50 p-4 rounded-md max-h-[400px] overflow-y-auto">
          {passage.split("\n\n").map((paragraph, index) => (
            <p key={index} className="mb-4">
              {paragraph}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  )
);
ReadingPassageCard.displayName = "ReadingPassageCard";

interface ProgressSummaryProps {
  answeredCount: number;
  totalQuestions: number;
  score: number;
}

/**
 * Progress summary display
 */
export const ProgressSummary = React.memo(
  ({ answeredCount, totalQuestions, score }: ProgressSummaryProps) => (
    <div className="mt-6 p-4 bg-gray-50 rounded-md">
      <p className="text-sm">
        <span className="font-medium">Progress:</span> {answeredCount} of{" "}
        {totalQuestions} questions answered
      </p>
      <p className="text-sm">
        <span className="font-medium">Current Score:</span> {score} correct out
        of {totalQuestions} total questions (
        {totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0}%)
      </p>
    </div>
  )
);
ProgressSummary.displayName = "ProgressSummary";

/**
 * Get a random micro lesson tip for a section
 */
export function getRandomMicroLessonTip(sectionId: string): string | null {
  const tips = MICRO_LESSONS[sectionId as keyof typeof MICRO_LESSONS];
  if (!tips || tips.length === 0) return null;
  return tips[Math.floor(Math.random() * tips.length)];
}

/**
 * Format remaining seconds as MM:SS
 */
export function formatTimer(remainingSeconds: number | null): string | null {
  if (remainingSeconds === null) return null;
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
