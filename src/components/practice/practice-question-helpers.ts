import type { PracticeMode } from "@/api/firebase/practiceProgressRepository";

export function timedRemaining(
  practiceMode: PracticeMode,
  remainingSeconds: number | null
): number | null {
  if (practiceMode === "timed") return remainingSeconds;
  return null;
}

export function passageForSection(
  sectionId: string,
  readingPassage: string | null
): string | null {
  if (sectionId === "reading") return readingPassage;
  return null;
}

export function answerCanBeChecked(
  showFeedback: boolean,
  selectedAnswer: string | undefined
): boolean {
  return !showFeedback && Boolean(selectedAnswer);
}
