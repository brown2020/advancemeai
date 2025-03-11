import { Flashcard, FlashcardSet } from "@/types/flashcard";

// Define a type for Firestore timestamp-like objects
interface TimestampLike {
  toMillis: () => number;
}

// Helper function to safely handle timestamps
function getTimestamp(value: unknown): number {
  if (
    value &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof (value as TimestampLike).toMillis === "function"
  ) {
    return (value as TimestampLike).toMillis();
  }

  if (typeof value === "number") {
    return value;
  }

  return Date.now();
}

export function normalizeFlashcardSet(
  data: Record<string, unknown>
): FlashcardSet {
  return {
    id: (data.id as string) || "",
    title: (data.title as string) || "",
    description: (data.description as string) || "",
    cards: Array.isArray(data.cards) ? data.cards.map(normalizeFlashcard) : [],
    userId: (data.userId as string) || "",
    createdAt: getTimestamp(data.createdAt),
    updatedAt: getTimestamp(data.updatedAt),
    isPublic: Boolean(data.isPublic),
  };
}

export function normalizeFlashcard(data: Record<string, unknown>): Flashcard {
  return {
    id: (data.id as string) || "",
    term: (data.term as string) || "",
    definition: (data.definition as string) || "",
    createdAt: getTimestamp(data.createdAt),
  };
}
