import type { Flashcard } from "@/types/flashcard";

export function clampMastery(value: number): 0 | 1 | 2 | 3 {
  if (value <= 0) return 0;
  if (value === 1) return 1;
  if (value === 2) return 2;
  return 3;
}

export function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i];
    const other = arr[j];
    if (temp !== undefined && other !== undefined) {
      arr[i] = other;
      arr[j] = temp;
    }
  }
  return arr;
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


