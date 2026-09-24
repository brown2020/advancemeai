import type { FlashcardSet } from "@/types/flashcard";
import type { FlashcardFolder } from "@/types/flashcard-folder";
import {
  canReadFlashcardSet,
  normalizeVisibility,
  visibilityToStorageFields,
} from "@/lib/flashcard-visibility";
import { toMillis } from "@/utils/timestamp";

export { canReadFlashcardSet };

/**
 * Checks if a document uses the legacy public flag (missing isPublic field)
 * @param data - Firestore document data
 * @returns True if document predates the isPublic field
 */
function isLegacyPublicFlag(data: Record<string, unknown>): boolean {
  return !Object.prototype.hasOwnProperty.call(data, "isPublic");
}

/**
 * Determines if content is public, supporting legacy documents
 * @param data - Firestore document data
 * @returns True if content is public or uses legacy public flag
 */
export function isPublicFromData(data: Record<string, unknown>): boolean {
  return data.isPublic === true || isLegacyPublicFlag(data);
}

export function mapFlashcardSet(id: string, data: Record<string, unknown>): FlashcardSet {
  const cardsRaw = Array.isArray(data.cards) ? data.cards : [];
  const cards = cardsRaw
    .map((c) => (c && typeof c === "object" ? (c as Record<string, unknown>) : null))
    .filter((c): c is Record<string, unknown> => Boolean(c))
    .map((c) => ({
      id: String(c.id ?? ""),
      term: String(c.term ?? ""),
      definition: String(c.definition ?? ""),
      createdAt: toMillis(c.createdAt),
    }));

  const visibility = normalizeVisibility(data);
  const { isPublic } = visibilityToStorageFields(visibility);

  return {
    id,
    title: String(data.title ?? ""),
    description: String(data.description ?? ""),
    cards,
    userId: String(data.userId ?? ""),
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
    isPublic,
    visibility,
    timesStudied:
      typeof data.timesStudied === "number" ? data.timesStudied : undefined,
  };
}

export function mapFlashcardFolder(
  id: string,
  data: Record<string, unknown>,
  userId: string
): FlashcardFolder {
  return {
    id,
    userId,
    name: String(data.name ?? ""),
    setIds: Array.isArray(data.setIds)
      ? (data.setIds as unknown[]).map((x) => String(x))
      : [],
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  };
}

