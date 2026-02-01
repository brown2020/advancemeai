"use client";

import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import type { StudyMode } from "@/types/flashcard";
import { Layers, Brain, ClipboardCheck, Pencil, Puzzle } from "lucide-react";

const MODE_CONFIG: Record<
  StudyMode,
  { label: string; icon: React.ComponentType<{ size?: number }> }
> = {
  cards: { label: "Flashcards", icon: Layers },
  learn: { label: "Learn", icon: Brain },
  test: { label: "Test", icon: ClipboardCheck },
  write: { label: "Write", icon: Pencil },
  match: { label: "Match", icon: Puzzle },
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
      {(Object.keys(MODE_CONFIG) as StudyMode[]).map((mode) => {
        const { label, icon: Icon } = MODE_CONFIG[mode];
        return (
          <Button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            variant={value === mode ? "default" : "outline"}
            size="sm"
            role="tab"
            aria-selected={value === mode}
            className="gap-1.5"
          >
            <Icon size={16} />
            {label}
          </Button>
        );
      })}
    </div>
  );
}
