"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/utils/cn";

type StudyFeedbackProps = {
  /** null renders an empty live region so announcements are picked up. */
  isCorrect: boolean | null;
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

/**
 * Correct / incorrect banner. Always mounted as an aria-live region so
 * screen readers announce the result as soon as it appears.
 */
export function StudyFeedback({
  isCorrect,
  title,
  children,
  className,
}: StudyFeedbackProps) {
  return (
    <div role="status" aria-live="polite" aria-atomic="true">
      {isCorrect === null ? null : (
        <div
          className={cn(
            "flex items-start gap-3 rounded-xl border px-4 py-3 motion-safe:animate-fade-in",
            isCorrect
              ? "border-success/30 bg-success/10"
              : "border-destructive/30 bg-destructive/10",
            className
          )}
        >
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full",
              isCorrect
                ? "bg-success text-success-foreground"
                : "bg-destructive text-destructive-foreground"
            )}
          >
            {isCorrect ? (
              <Check className="size-4" aria-hidden />
            ) : (
              <X className="size-4" aria-hidden />
            )}
          </span>
          <div className="min-w-0 flex-1 text-sm">
            <p
              className={cn(
                "font-semibold",
                isCorrect ? "text-success" : "text-destructive"
              )}
            >
              {title ?? (isCorrect ? "Correct!" : "Not quite")}
            </p>
            {children ? <div className="mt-1 text-foreground">{children}</div> : null}
          </div>
        </div>
      )}
    </div>
  );
}
