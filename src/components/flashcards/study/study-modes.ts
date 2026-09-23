import {
  Brain,
  ClipboardCheck,
  Layers,
  Pencil,
  Puzzle,
  type LucideIcon,
} from "lucide-react";
import type { StudyMode } from "@/types/flashcard";

export type StudyModeMeta = {
  mode: StudyMode;
  label: string;
  description: string;
  icon: LucideIcon;
};

/** Display order and copy for the five study modes. */
export const STUDY_MODES: StudyModeMeta[] = [
  {
    mode: "cards",
    label: "Flashcards",
    description: "Flip through cards",
    icon: Layers,
  },
  {
    mode: "learn",
    label: "Learn",
    description: "Adaptive quizzing",
    icon: Brain,
  },
  {
    mode: "write",
    label: "Write",
    description: "Type the answers",
    icon: Pencil,
  },
  {
    mode: "match",
    label: "Match",
    description: "Race the clock",
    icon: Puzzle,
  },
  {
    mode: "test",
    label: "Test",
    description: "Graded quiz",
    icon: ClipboardCheck,
  },
];

export function getStudyModeMeta(mode: StudyMode): StudyModeMeta {
  return STUDY_MODES.find((m) => m.mode === mode) ?? STUDY_MODES[0]!;
}
