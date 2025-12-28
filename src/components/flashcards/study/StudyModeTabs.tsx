"use client";

import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import type { StudyMode } from "@/types/flashcard";

const MODE_LABEL: Record<StudyMode, string> = {
  cards: "Flashcards",
  learn: "Learn",
  test: "Test",
};

export function StudyModeTabs({
  value,
  onChange,
  className,
}: {
  value: StudyMode;
  onChange: (mode: StudyMode) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)} role="tablist">
      {(Object.keys(MODE_LABEL) as StudyMode[]).map((mode) => (
        <Button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          variant={value === mode ? "default" : "outline"}
          size="sm"
          role="tab"
          aria-selected={value === mode}
        >
          {MODE_LABEL[mode]}
        </Button>
      ))}
    </div>
  );
}


