"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/utils/cn";
import { optionLetter, type TakeableQuestion } from "./quiz-utils";

type QuizQuestionCardProps = {
  question: TakeableQuestion;
  /** The option the student picked, or undefined while unanswered. */
  selected?: string;
  onSelect: (option: string) => void;
};

/** Centered question with large lettered answer buttons and instant feedback. */
export function QuizQuestionCard({ question, selected, onSelect }: QuizQuestionCardProps) {
  const answered = selected !== undefined;
  const isCorrect = answered && selected === question.correctAnswer;

  return (
    <div className="animate-fade-in">
      <Card className="px-5 py-8 text-center sm:px-10 sm:py-12">
        <p className="whitespace-pre-wrap break-words text-xl font-semibold leading-snug sm:text-2xl">
          {question.text}
        </p>
      </Card>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {question.options.map((option, index) => {
          const isAnswer = option === question.correctAnswer;
          const isChosen = option === selected;
          const showCorrect = answered && isAnswer;
          const showWrong = answered && isChosen && !isAnswer;

          return (
            <button
              key={index}
              type="button"
              onClick={() => onSelect(option)}
              disabled={answered}
              aria-pressed={isChosen}
              className={cn(
                "flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 bg-card px-4 py-3 text-left text-base font-medium shadow-card transition-[border-color,background-color,opacity,transform]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                !answered && "border-border hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lift",
                showCorrect && "border-success bg-success/10",
                showWrong && "animate-shake border-destructive bg-destructive/10",
                answered && !showCorrect && !showWrong && "border-border opacity-55"
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
                  showCorrect
                    ? "bg-success text-success-foreground"
                    : showWrong
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-secondary text-muted-foreground"
                )}
                aria-hidden
              >
                {showCorrect ? (
                  <CheckCircle2 className="size-5" />
                ) : showWrong ? (
                  <XCircle className="size-5" />
                ) : (
                  optionLetter(index)
                )}
              </span>
              <span className="min-w-0 flex-1 break-words">{option}</span>
              {showCorrect && <span className="sr-only">(correct answer)</span>}
              {showWrong && <span className="sr-only">(your answer, incorrect)</span>}
            </button>
          );
        })}
      </div>

      <div aria-live="polite" className="mt-4 min-h-12">
        {answered && (
          <div
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold animate-slide-up",
              isCorrect ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            )}
          >
            {isCorrect ? (
              <CheckCircle2 className="size-5 shrink-0" aria-hidden />
            ) : (
              <XCircle className="size-5 shrink-0" aria-hidden />
            )}
            {isCorrect ? (
              "Correct!"
            ) : (
              <span>
                Not quite. The answer is{" "}
                <span className="text-foreground">{question.correctAnswer}</span>.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
