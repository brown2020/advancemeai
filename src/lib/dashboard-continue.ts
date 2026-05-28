import { SECTION_TITLES } from "@/constants/appConstants";
import type { DashboardContinueStudying } from "@/types/dashboard";

export type PracticeActivitySnapshot = {
  sectionId: string;
  at: number;
};

export type FlashcardActivitySnapshot = {
  setId: string;
  title: string;
  at: number;
};

/**
 * Picks the most recent continue-studying destination from practice vs flashcards.
 */
export function pickContinueStudying(
  lastPractice: PracticeActivitySnapshot | null,
  lastFlashcard: FlashcardActivitySnapshot | null
): DashboardContinueStudying | null {
  if (!lastPractice && !lastFlashcard) return null;

  const usePractice =
    lastPractice &&
    (!lastFlashcard || lastPractice.at >= lastFlashcard.at);

  if (usePractice && lastPractice) {
    const sectionTitle =
      SECTION_TITLES[lastPractice.sectionId] ?? lastPractice.sectionId;
    return {
      type: "practice",
      href: `/practice/${lastPractice.sectionId}`,
      title: `Continue ${sectionTitle}`,
      subtitle: "Pick up your SAT practice where you left off",
    };
  }

  if (lastFlashcard) {
    return {
      type: "flashcards",
      href: `/flashcards/${lastFlashcard.setId}`,
      title: lastFlashcard.title || "Continue flashcards",
      subtitle: "Resume studying your flashcard set",
    };
  }

  return null;
}
