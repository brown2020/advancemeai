import {
  BookOpenText,
  Calculator,
  PenLine,
  Sigma,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { SECTION_TITLES } from "@/constants/appConstants";

type SectionMeta = {
  title: string;
  icon: LucideIcon;
  /** One-line summary shown on hub cards. */
  blurb: string;
};

const SECTION_META: Record<string, SectionMeta> = {
  reading: {
    title: "Reading",
    icon: BookOpenText,
    blurb: "Passage-based comprehension, evidence, and inference.",
  },
  writing: {
    title: "Writing",
    icon: PenLine,
    blurb: "Grammar, punctuation, and rhetorical choices.",
  },
  "math-no-calc": {
    title: "Math (No Calculator)",
    icon: Sigma,
    blurb: "Algebra and reasoning you can do by hand.",
  },
  "math-calc": {
    title: "Math (Calculator)",
    icon: Calculator,
    blurb: "Data analysis, advanced math, and problem solving.",
  },
  "reading-writing": {
    title: "Reading & Writing",
    icon: BookOpenText,
    blurb: "Comprehension, grammar, and rhetoric.",
  },
  math: {
    title: "Math",
    icon: Calculator,
    blurb: "Algebra, problem solving, and advanced math.",
  },
};

export function getSectionMeta(sectionId: string): SectionMeta {
  return (
    SECTION_META[sectionId] ?? {
      title: SECTION_TITLES[sectionId] ?? sectionId,
      icon: Sparkles,
      blurb: "AI-generated practice questions.",
    }
  );
}

/** Answer options arrive as "A) text"; strip the label so we can render our own. */
export function stripOptionLabel(option: string): string {
  return option.replace(/^[A-Z]\)\s*/, "").trim();
}

export const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"] as const;

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export function percent(score: number, total: number): number {
  return total > 0 ? Math.round((score / total) * 100) : 0;
}
