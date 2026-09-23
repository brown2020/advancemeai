"use client";

import { cn } from "@/utils/cn";

type QuestionNavigatorProps = {
  total: number;
  currentIndex: number;
  /** Indexes that have an answer selected. */
  isAnswered: (index: number) => boolean;
  /** Only indexes below this are reachable (questions still loading beyond). */
  available?: number;
  onJump: (index: number) => void;
};

/** Compact numbered grid for jumping between questions. */
export function QuestionNavigator({
  total,
  currentIndex,
  isAnswered,
  available = total,
  onJump,
}: QuestionNavigatorProps) {
  return (
    <nav aria-label="Questions" className="flex flex-wrap justify-center gap-1.5">
      {Array.from({ length: total }, (_, index) => {
        const answered = isAnswered(index);
        const current = index === currentIndex;
        return (
          <button
            key={index}
            type="button"
            onClick={() => onJump(index)}
            disabled={index >= available}
            aria-current={current ? "step" : undefined}
            aria-label={`Question ${index + 1}${answered ? ", answered" : ""}`}
            className={cn(
              "flex size-8 items-center justify-center rounded-lg border text-xs font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40",
              answered
                ? "border-primary bg-primary text-primary-foreground"
                : "border-dashed border-border bg-card text-muted-foreground hover:border-primary/40",
              current && "ring-2 ring-foreground ring-offset-2 ring-offset-card"
            )}
          >
            {index + 1}
          </button>
        );
      })}
    </nav>
  );
}
