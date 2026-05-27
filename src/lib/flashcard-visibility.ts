import type { FlashcardSet, FlashcardVisibility } from "@/types/flashcard";

export type FlashcardVisibilityInput = {
  visibility?: FlashcardVisibility | string;
  isPublic?: boolean;
};

/** Documents created before `isPublic` existed are treated as public. */
export function isLegacyPublicFlag(data: Record<string, unknown>): boolean {
  return !Object.prototype.hasOwnProperty.call(data, "isPublic");
}

/**
 * Resolves effective visibility from `visibility` with `isPublic` compatibility shim.
 */
export function normalizeVisibility(
  data: FlashcardVisibilityInput | Record<string, unknown>
): FlashcardVisibility {
  const visibility = (data as FlashcardVisibilityInput).visibility;
  if (
    visibility === "public" ||
    visibility === "unlisted" ||
    visibility === "private"
  ) {
    return visibility;
  }

  const record = data as Record<string, unknown>;
  if (isLegacyPublicFlag(record)) {
    return "public";
  }

  return (data as FlashcardVisibilityInput).isPublic === true ? "public" : "private";
}

/** Firestore fields written on create/update (keeps `isPublic` in sync). */
export function visibilityToStorageFields(visibility: FlashcardVisibility): {
  visibility: FlashcardVisibility;
  isPublic: boolean;
} {
  return {
    visibility,
    isPublic: visibility === "public",
  };
}

/** Sets discoverable via search (public only). */
export function isSearchableVisibility(
  data: FlashcardVisibilityInput | Record<string, unknown>
): boolean {
  return normalizeVisibility(data) === "public";
}

/** Anyone with the set id can read (public + unlisted + owner for private). */
export function canReadFlashcardSet(
  data: FlashcardVisibilityInput | Record<string, unknown>,
  viewerUserId?: string | null
): boolean {
  const ownerId =
    typeof (data as Record<string, unknown>).userId === "string"
      ? ((data as Record<string, unknown>).userId as string)
      : undefined;

  if (viewerUserId && ownerId && viewerUserId === ownerId) {
    return true;
  }

  const visibility = normalizeVisibility(data);
  return visibility === "public" || visibility === "unlisted";
}

export function canReadFlashcardSetModel(
  set: FlashcardSet,
  viewerUserId?: string | null
): boolean {
  return canReadFlashcardSet(set, viewerUserId);
}

/** Non-owners may copy public or unlisted sets. */
export function canCopyFlashcardSet(
  data: FlashcardVisibilityInput | Record<string, unknown>,
  viewerUserId: string
): boolean {
  const ownerId =
    typeof (data as Record<string, unknown>).userId === "string"
      ? ((data as Record<string, unknown>).userId as string)
      : undefined;

  if (ownerId && viewerUserId === ownerId) {
    return true;
  }

  const visibility = normalizeVisibility(data);
  return visibility === "public" || visibility === "unlisted";
}

export function applyVisibilityFields<
  T extends Record<string, unknown>,
>(data: T, visibility: FlashcardVisibility): T & {
  visibility: FlashcardVisibility;
  isPublic: boolean;
} {
  const fields = visibilityToStorageFields(visibility);
  return { ...data, ...fields };
}
