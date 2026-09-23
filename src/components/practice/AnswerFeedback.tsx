import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/utils/cn";

type AnswerFeedbackProps = {
  isCorrect: boolean;
  explanation?: string;
  /** Shown on incorrect answers so the right choice is stated in text. */
  correctAnswer?: string;
  /** Extra content, e.g. the "Explain my mistake" button. */
  children?: React.ReactNode;
};

/** Correct/incorrect explanation panel shown after checking an answer. */
export function AnswerFeedback({
  isCorrect,
  explanation,
  correctAnswer,
  children,
}: AnswerFeedbackProps) {
  const Icon = isCorrect ? CheckCircle2 : XCircle;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "animate-fade-in rounded-2xl border p-4 sm:p-5",
        isCorrect
          ? "border-success/30 bg-success/10"
          : "border-destructive/30 bg-destructive/10"
      )}
    >
      <div className="flex items-start gap-3">
        <Icon
          className={cn(
            "mt-0.5 size-5 shrink-0",
            isCorrect ? "text-success" : "text-destructive"
          )}
          aria-hidden
        />
        <div className="min-w-0 flex-1 space-y-2">
          <p
            className={cn(
              "font-semibold",
              isCorrect ? "text-success" : "text-destructive"
            )}
          >
            {isCorrect ? "Correct!" : "Not quite"}
          </p>
          {!isCorrect && correctAnswer && (
            <p className="text-sm">
              <span className="font-medium">Correct answer:</span>{" "}
              {correctAnswer}
            </p>
          )}
          {explanation && (
            <p className="text-sm leading-relaxed text-foreground/90">
              <span className="font-medium">Explanation:</span> {explanation}
            </p>
          )}
          {children && <div className="pt-1">{children}</div>}
        </div>
      </div>
    </div>
  );
}
