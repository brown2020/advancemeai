"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const STEPS = [
  "Reading your material…",
  "Finding the key ideas…",
  "Organizing sections…",
  "Writing flashcards and questions…",
  "Almost there…",
];

/** Loading panel shown while the AI builds the guide (can take ~20–40s). */
export function StudyGuideGenerating() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 6000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="animate-fade-in rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8"
      aria-busy="true"
    >
      <div className="mb-6 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-primary">
          <Loader2 className="size-5 animate-spin" aria-hidden />
        </span>
        <div>
          <p className="font-semibold">Building your study guide</p>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {STEPS[step]}
          </p>
        </div>
      </div>
      <div className="space-y-3" aria-hidden>
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
        <div className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-2">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </div>
      <p className="mt-6 text-xs text-muted-foreground">
        This usually takes 20–40 seconds. Keep this tab open.
      </p>
    </div>
  );
}
