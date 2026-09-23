"use client";

import Link from "next/link";
import { AlertCircle, Lightbulb, Loader2, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button-variants";
import { ROUTES } from "@/constants/appConstants";

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

/** Micro-lesson tip callout shown above questions in micro mode. */
export function MicroLessonTip({ tip }: { tip: string | null }) {
  if (!tip) return null;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-accent p-4 text-sm text-accent-foreground">
      <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
      <p>
        <span className="font-semibold">Micro-lesson:</span> {tip}
      </p>
    </div>
  );
}

/** Loading state while AI generates the requested questions. */
export function GeneratingQuestionsCard({
  selectedCount,
  sectionTitle,
}: {
  selectedCount: number;
  sectionTitle: string;
}) {
  return (
    <div
      className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center"
      aria-busy="true"
    >
      <div className="relative mb-6 flex size-16 items-center justify-center rounded-2xl bg-accent text-primary">
        <Sparkles className="size-7" aria-hidden />
        <Loader2
          className="absolute -right-2 -top-2 size-6 animate-spin text-primary"
          aria-hidden
        />
      </div>
      <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
        Building your practice set
      </h1>
      <p className="mt-2 text-muted-foreground" role="status">
        Generating {selectedCount} custom {sectionTitle} question
        {selectedCount === 1 ? "" : "s"}. This can take a moment.
      </p>
    </div>
  );
}

/** Skeleton shaped like a question screen. */
export function QuestionLoadingSkeleton({ message }: { message?: string }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6" aria-busy="true">
      <Skeleton className="mb-4 h-8 w-8 rounded-lg" />
      <Skeleton className="mb-2 h-5 w-full" />
      <Skeleton className="mb-8 h-5 w-3/4" />
      <div className="space-y-3">
        {[0, 1, 2, 3].map((row) => (
          <Skeleton key={row} className="h-14 w-full rounded-xl" />
        ))}
      </div>
      {message && (
        <p className="mt-6 text-center text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}

/** Full-screen error state with a way back to the SAT Prep hub. */
export function ErrorCard({
  message,
  action,
}: {
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-16 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertCircle className="size-6" aria-hidden />
      </div>
      <p role="alert" className="text-base font-medium">
        {message}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {action}
        <Link
          href={ROUTES.PRACTICE.INDEX}
          className={buttonVariants({ variant: action ? "outline" : "default" })}
        >
          Back to SAT Prep
        </Link>
      </div>
    </div>
  );
}

/**
 * Get a random micro lesson tip for a section
 */
export function getRandomMicroLessonTip(sectionId: string): string | null {
  const tips = MICRO_LESSONS[sectionId];
  if (!tips || tips.length === 0) return null;
  return tips[Math.floor(Math.random() * tips.length)] ?? null;
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
