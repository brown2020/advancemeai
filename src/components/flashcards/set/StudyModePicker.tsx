"use client";

import type { StudyMode } from "@/types/flashcard";
import { STUDY_MODES } from "@/components/flashcards/study/study-modes";
import { cn } from "@/utils/cn";

type StudyModePickerProps = {
  onSelectMode: (mode: StudyMode) => void;
  className?: string;
};

/** Row of study mode tiles (Flashcards, Learn, Write, Match, Test). */
export function StudyModePicker({ onSelectMode, className }: StudyModePickerProps) {
  return (
    <nav aria-label="Study modes" className={className}>
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
        {STUDY_MODES.map(({ mode, label, description, icon: Icon }, idx) => (
          <li
            key={mode}
            className={cn(
              // Five tiles on a two-column phone grid: let the first span both.
              idx === 0 && "col-span-2 sm:col-span-1"
            )}
          >
            <button
              type="button"
              onClick={() => onSelectMode(mode)}
              className={cn(
                "group flex h-full min-h-14 w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left shadow-card transition-[border-color,box-shadow,transform] duration-200 sm:p-4",
                "hover:border-primary/30 hover:shadow-lift motion-safe:hover:-translate-y-0.5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              )}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold">{label}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {description}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
