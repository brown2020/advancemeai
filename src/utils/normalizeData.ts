import { Flashcard, FlashcardSet } from "@/types/flashcard";
import { timestampToNumber } from "@/utils/timestamp";

export function normalizeFlashcardSet(
  data: Record<string, unknown>
): FlashcardSet {
  return {
    id: (data.id as string) || "",
    title: (data.title as string) || "",
    description: (data.description as string) || "",
    cards: Array.isArray(data.cards) ? data.cards.map(normalizeFlashcard) : [],
    userId: (data.userId as string) || "",
    createdAt: timestampToNumber(data.createdAt),
    updatedAt: timestampToNumber(data.updatedAt),
    isPublic: Boolean(data.isPublic),
  };
}

export function normalizeFlashcard(data: Record<string, unknown>): Flashcard {
  return {
    id: (data.id as string) || "",
    term: (data.term as string) || "",
    definition: (data.definition as string) || "",
    createdAt: timestampToNumber(data.createdAt),
  };
}
