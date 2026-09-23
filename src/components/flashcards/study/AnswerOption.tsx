"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/utils/cn";

export type AnswerOptionState =
  | "idle"
  | "selected"
  | "correct"
  | "incorrect"
  | "muted";

type AnswerOptionProps = {
  state: AnswerOptionState;
  onSelect: () => void;
  disabled?: boolean;
  /** 1-based number shown as a keyboard hint. */
  shortcut?: number;
  imageUrl?: string;
  children: React.ReactNode;
};

const STATE_CLASSES: Record<AnswerOptionState, string> = {
  idle: "border-border bg-card hover:border-primary/40 hover:bg-accent/50",
  selected: "border-primary bg-accent ring-2 ring-primary/30",
  correct: "border-success bg-success/10",
  incorrect: "border-destructive bg-destructive/10",
  muted: "border-border bg-card opacity-60",
};

/**
 * Large tappable answer choice used by Learn and Test.
 * Correct/incorrect states add an icon + screen-reader text, never color alone.
 */
export function AnswerOption({
  state,
  onSelect,
  disabled,
  shortcut,
  imageUrl,
  children,
}: AnswerOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={state === "selected" ? true : undefined}
      className={cn(
        "group flex min-h-14 w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-base transition-[border-color,background-color,opacity] duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-default",
        STATE_CLASSES[state],
        state === "incorrect" && "motion-safe:animate-shake"
      )}
    >
      <OptionMarker state={state} shortcut={shortcut} />
      <span className="min-w-0 flex-1">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="mb-2 max-h-24 rounded-lg object-contain"
          />
        ) : null}
        <span className="block whitespace-pre-wrap break-words">{children}</span>
      </span>
      {state === "correct" ? <span className="sr-only">(correct answer)</span> : null}
      {state === "incorrect" ? <span className="sr-only">(your answer, incorrect)</span> : null}
    </button>
  );
}

function OptionMarker({
  state,
  shortcut,
}: {
  state: AnswerOptionState;
  shortcut?: number;
}) {
  if (state === "correct") {
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
        <Check className="size-4" aria-hidden />
      </span>
    );
  }
  if (state === "incorrect") {
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
        <X className="size-4" aria-hidden />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums",
        state === "selected"
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground group-hover:border-primary/40"
      )}
      aria-hidden
    >
      {shortcut ?? ""}
    </span>
  );
}
