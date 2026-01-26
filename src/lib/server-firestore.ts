import type { FlashcardSet } from "@/types/flashcard";
import type { FlashcardFolder } from "@/types/flashcard-folder";

export function toMillis(value: unknown): number {
  if (typeof value === "number") return value;

  // Firestore Timestamp-like (admin + client): toMillis()
  if (value && typeof value === "object") {
    const v = value as Record<string, unknown>;
    const maybeToMillis = v.toMillis;
    if (typeof maybeToMillis === "function") {
      // Must call as a method to preserve `this` binding.
      return (value as { toMillis: () => number }).toMillis();
    }

    // Some timestamp shapes expose seconds/nanoseconds (or _seconds/_nanoseconds)
    const seconds =
      typeof v.seconds === "number"
        ? v.seconds
        : typeof v._seconds === "number"
          ? v._seconds
          : null;
    const nanos =
      typeof v.nanoseconds === "number"
        ? v.nanoseconds
        : typeof v._nanoseconds === "number"
          ? v._nanoseconds
          : 0;
    if (typeof seconds === "number") {
      return seconds * 1000 + Math.floor(nanos / 1_000_000);
    }
  }

  return Date.now();
}

/**
 * Checks if a document uses the legacy public flag (missing isPublic field)
 * @param data - Firestore document data
 * @returns True if document predates the isPublic field
 */
export function isLegacyPublicFlag(data: Record<string, unknown>): boolean {
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

  return {
    id,
    title: String(data.title ?? ""),
    description: String(data.description ?? ""),
    cards,
    userId: String(data.userId ?? ""),
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
    isPublic: isPublicFromData(data),
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

