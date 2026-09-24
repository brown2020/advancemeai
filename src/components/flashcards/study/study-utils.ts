import type { Flashcard } from "@/types/flashcard";
import { shuffle } from "@/utils/random";

/** Per-card mastery level used by Learn mode and set progress (3 = mastered). */
export type MasteryLevel = 0 | 1 | 2 | 3;
export type MasteryMap = Record<string, MasteryLevel>;

export function clampMastery(value: number): MasteryLevel {
  if (value <= 0) return 0;
  if (value === 1) return 1;
  if (value === 2) return 2;
  return 3;
}

export function buildMultipleChoiceOptions(
  cards: Flashcard[],
  correctCardId: string,
  optionCount = 4
): { optionCardIds: string[]; correctIndex: number } {
  const correct = cards.find((c) => c.id === correctCardId);
  if (!correct) {
    return { optionCardIds: cards.slice(0, optionCount).map((c) => c.id), correctIndex: 0 };
  }

  const distractors = shuffle(cards.filter((c) => c.id !== correctCardId))
    .slice(0, Math.max(0, optionCount - 1))
    .map((c) => c.id);

  const optionCardIds = shuffle([correctCardId, ...distractors]);
  const correctIndex = optionCardIds.indexOf(correctCardId);
  return { optionCardIds, correctIndex };
}

/** Formats seconds as m:ss (e.g. 75 → "1:15"). */
export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/** Whole seconds elapsed since a Date.now() timestamp. */
export function secondsSince(startedAt: number): number {
  return Math.floor((Date.now() - startedAt) / 1000);
}

/**
 * True when a keyboard event comes from somewhere that owns its own keys
 * (text fields, buttons, links, open dialogs), so global shortcuts should
 * stay out of the way.
 */
export function isInteractiveKeyTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target.closest("[role='dialog'], [role='menu'], [data-radix-popper-content-wrapper]")) {
    return true;
  }
  return Boolean(
    target.closest("input, textarea, select, button, a[href], [role='button'], [role='switch'], [role='tab']")
  );
}

/** True for text fields, selects and open dialogs/popovers (arrow keys belong to them). */
export function isTextEntryTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return Boolean(
    target.closest(
      "input, textarea, select, [role='dialog'], [role='menu'], [data-radix-popper-content-wrapper]"
    )
  );
}
