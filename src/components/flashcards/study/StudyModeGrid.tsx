"use client";

import { cn } from "@/utils/cn";
import type { StudyMode } from "@/types/flashcard";
import { Layers, Brain, ClipboardCheck, Pencil, Puzzle } from "lucide-react";

interface StudyModeConfig {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

const MODE_CONFIG: Record<StudyMode, StudyModeConfig> = {
  cards: {
    label: "Flashcards",
    description: "Review cards one by one",
    icon: Layers,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/50",
  },
  learn: {
    label: "Learn",
    description: "Adaptive learning with feedback",
    icon: Brain,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-950/50",
  },
  test: {
    label: "Test",
    description: "Quiz yourself with questions",
    icon: ClipboardCheck,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30 hover:bg-green-100 dark:hover:bg-green-950/50",
  },
  write: {
    label: "Write",
    description: "Practice by typing answers",
    icon: Pencil,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/30 hover:bg-orange-100 dark:hover:bg-orange-950/50",
  },
  match: {
    label: "Match",
    description: "Match terms to definitions",
    icon: Puzzle,
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-50 dark:bg-pink-950/30 hover:bg-pink-100 dark:hover:bg-pink-950/50",
  },
};

interface StudyModeGridProps {
  onSelectMode: (mode: StudyMode) => void;
  className?: string;
}

export function StudyModeGrid({ onSelectMode, className }: StudyModeGridProps) {
  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3", className)}>
      {(Object.keys(MODE_CONFIG) as StudyMode[]).map((mode) => {
        const { label, description, icon: Icon, color, bgColor } = MODE_CONFIG[mode];
        return (
          <button
            key={mode}
            onClick={() => onSelectMode(mode)}
            className={cn(
              "flex flex-col items-center justify-center p-4 rounded-xl border border-border transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              bgColor
            )}
          >
            <Icon className={cn("h-8 w-8 mb-2", color)} />
            <span className="font-semibold text-sm">{label}</span>
            <span className="text-xs text-muted-foreground text-center mt-1 hidden sm:block">
              {description}
            </span>
          </button>
        );
      })}
    </div>
  );
}

interface StudyModeCardProps {
  mode: StudyMode;
  onClick: () => void;
  isActive?: boolean;
}

export function StudyModeCard({ mode, onClick, isActive }: StudyModeCardProps) {
  const { label, description, icon: Icon, color, bgColor } = MODE_CONFIG[mode];

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-4 rounded-xl border transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isActive
          ? "border-primary ring-2 ring-primary ring-offset-2"
          : "border-border",
        bgColor
      )}
    >
      <Icon className={cn("h-8 w-8 mb-2", color)} />
      <span className="font-semibold text-sm">{label}</span>
      <span className="text-xs text-muted-foreground text-center mt-1 hidden sm:block">
        {description}
      </span>
    </button>
  );
}
