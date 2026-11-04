import type { FlashcardSet } from "@/types/flashcard";
import { createFlashcardSet } from "@/services/flashcardService";
import { ROUTES } from "@/constants/appConstants";
import { canCopyFlashcardSet } from "@/lib/flashcard-visibility";
import type { MasteryMap } from "@/components/flashcards/study/study-utils";
import type { StudyMode } from "@/types/flashcard";

type SetRouter = { push: (href: string) => void };

export function studySetIsReady(
  error: string | null,
  set: FlashcardSet | null
): set is FlashcardSet {
  return !error && set !== null;
}

export function isDeckActive(activeMode: StudyMode | null): boolean {
  return activeMode === null || activeMode === "cards";
}

export function countMasteredCards(masteryByCardId: MasteryMap): number {
  return Object.values(masteryByCardId).filter((level) => level >= 3).length;
}

export function ownsFlashcardSet(userId: string | null, ownerId: string): boolean {
  return Boolean(userId && userId === ownerId);
}

export function viewerCanCopySet(
  set: FlashcardSet,
  userId: string | null,
  isOwner: boolean
): boolean {
  return Boolean(userId && canCopyFlashcardSet(set, userId)) && !isOwner;
}

export function emptySetTitle(title: string): string {
  return title || "This set is empty";
}

/** Copies a set into the signed-in user's library. Failures leave the button idle again. */
export async function copyStudySet(
  userId: string | null,
  set: FlashcardSet | null,
  router: SetRouter,
  setIsCopying: (copying: boolean) => void
): Promise<void> {
  if (!userId || !set) return;
  setIsCopying(true);
  try {
    const newSetId = await createFlashcardSet(
      userId,
      `${set.title} (copy)`,
      set.description ?? "",
      set.cards.map((card) => ({ term: card.term, definition: card.definition })),
      "private"
    );
    router.push(ROUTES.FLASHCARDS.SET(newSetId));
  } catch {
    // no-op: the button simply re-enables.
  } finally {
    setIsCopying(false);
  }
}
