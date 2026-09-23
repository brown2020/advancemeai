"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/utils/cn";
import { OPTION_LETTERS, stripOptionLabel } from "./sectionMeta";

type AnswerChoicesProps = {
  options: string[];
  selected: string | null | undefined;
  onSelect: (option: string) => void;
  /** When set, correct/incorrect states are shown and choices lock. */
  revealed?: boolean;
  correctAnswer?: string;
  disabled?: boolean;
  label?: string;
};

type ChoiceState = "idle" | "selected" | "correct" | "incorrect" | "dimmed";

function getChoiceState(
  option: string,
  selected: string | null | undefined,
  revealed: boolean,
  correctAnswer: string | undefined
): ChoiceState {
  if (!revealed) return option === selected ? "selected" : "idle";
  if (option === correctAnswer) return "correct";
  if (option === selected) return "incorrect";
  return "dimmed";
}

const CHOICE_STYLES: Record<ChoiceState, { row: string; letter: string }> = {
  idle: {
    row: "border-border bg-card hover:border-primary/40 hover:bg-accent/40",
    letter: "border-border bg-card text-foreground",
  },
  selected: {
    row: "border-primary bg-accent ring-1 ring-primary",
    letter: "border-primary bg-primary text-primary-foreground",
  },
  correct: {
    row: "border-success bg-success/10",
    letter: "border-success bg-success text-success-foreground",
  },
  incorrect: {
    row: "border-destructive bg-destructive/10",
    letter: "border-destructive bg-destructive text-destructive-foreground",
  },
  dimmed: {
    row: "border-border bg-card opacity-60",
    letter: "border-border bg-card text-muted-foreground",
  },
};

/** Large lettered (A–D) answer buttons, Bluebook-style. */
export function AnswerChoices({
  options,
  selected,
  onSelect,
  revealed = false,
  correctAnswer,
  disabled = false,
  label = "Answer choices",
}: AnswerChoicesProps) {
  const locked = revealed || disabled;

  return (
    <div role="radiogroup" aria-label={label} className="space-y-3">
      {options.map((option, index) => {
        const state = getChoiceState(option, selected, revealed, correctAnswer);
        const styles = CHOICE_STYLES[state];
        const letter = OPTION_LETTERS[index] ?? String(index + 1);

        return (
          <button
            key={`${index}-${option}`}
            type="button"
            role="radio"
            aria-checked={option === selected}
            disabled={locked}
            onClick={() => onSelect(option)}
            className={cn(
              "flex min-h-14 w-full items-center gap-3 rounded-xl border-2 px-3 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-default sm:text-base",
              styles.row
            )}
          >
            <span
              aria-hidden
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold",
                styles.letter
              )}
            >
              {letter}
            </span>
            <span className="min-w-0 flex-1">
              <span className="sr-only">{letter}. </span>
              {stripOptionLabel(option)}
            </span>
            {state === "correct" && (
              <span className="flex items-center gap-1 text-xs font-semibold text-success">
                <CheckCircle2 className="size-5" aria-hidden />
                <span className="sr-only sm:not-sr-only">Correct</span>
              </span>
            )}
            {state === "incorrect" && (
              <span className="flex items-center gap-1 text-xs font-semibold text-destructive">
                <XCircle className="size-5" aria-hidden />
                <span className="sr-only sm:not-sr-only">Your answer</span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
