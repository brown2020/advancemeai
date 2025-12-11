import {
  createFlashcardSet as createFlashcardSetRepo,
  getUserFlashcardSets as getUserFlashcardSetsRepo,
  getFlashcardSet as getFlashcardSetRepo,
  updateFlashcardSet as updateFlashcardSetRepo,
  deleteFlashcardSet as deleteFlashcardSetRepo,
  getPublicFlashcardSets as getPublicFlashcardSetsRepo,
} from "@/api/firebase/flashcardRepository";
import {
  FlashcardSet,
  FlashcardId,
  UserId,
  FlashcardFormData,
} from "@/types/flashcard";
import { CACHE_KEYS } from "@/constants/appConstants";
import { createCachedService } from "@/utils/cachedService";

// Create cached service instance
const {
  cachedFetch,
  getCache,
  set: setCache,
  getStats,
} = createCachedService<FlashcardSet | FlashcardSet[]>("flashcard");

/**
 * Creates a new flashcard set
 */
export async function createFlashcardSet(
  userId: UserId,
  title: string,
  description: string,
  cards: FlashcardFormData[],
  isPublic: boolean
): Promise<FlashcardId> {
  const invalidateKeys = [CACHE_KEYS.FLASHCARD.USER_SETS(userId)];

  if (isPublic) {
    invalidateKeys.push(CACHE_KEYS.FLASHCARD.PUBLIC_SETS);
  }

  return cachedFetch({
    cacheKey: "",
    fetchData: () =>
      createFlashcardSetRepo(userId, title, description, cards, isPublic),
    invalidateKeys,
    logMessage: `Creating flashcard set for user: ${userId}`,
  });
}

/**
 * Gets all flashcard sets for a user
 */
export async function getUserFlashcardSets(
  userId: UserId
): Promise<FlashcardSet[]> {
  const cacheKey = CACHE_KEYS.FLASHCARD.USER_SETS(userId);

  return cachedFetch({
    cacheKey,
    fetchData: async () => {
      const sets = await getUserFlashcardSetsRepo(userId);

      // Cache individual sets for faster access later
      sets.forEach((set) => {
        setCache(CACHE_KEYS.FLASHCARD.SET(set.id), set);
      });

      return sets;
    },
    logMessage: `Fetching flashcard sets for user: ${userId}`,
  });
}

/**
 * Gets a specific flashcard set by ID
 */
export async function getFlashcardSet(
  setId: FlashcardId
): Promise<FlashcardSet> {
  return cachedFetch({
    cacheKey: CACHE_KEYS.FLASHCARD.SET(setId),
    fetchData: () => getFlashcardSetRepo(setId),
    logMessage: `Fetching flashcard set: ${setId}`,
  });
}

/**
 * Prefetches a flashcard set by ID (for optimistic loading)
 * This doesn't throw errors if the set doesn't exist
 */
export async function prefetchFlashcardSet(setId: FlashcardId): Promise<void> {
  const cacheKey = CACHE_KEYS.FLASHCARD.SET(setId);

  // If already in cache, don't do anything
  if (getCache().has(cacheKey)) {
    return;
  }

  // Start fetching but don't wait for result
  getFlashcardSet(setId).catch(() => {
    // Silently fail for prefetching
  });
}

/**
 * Updates a flashcard set
 */
export async function updateFlashcardSet(
  setId: FlashcardId,
  userId: UserId,
  updates: Partial<Omit<FlashcardSet, "id" | "userId" | "createdAt">>
): Promise<void> {
  // Get the set before updating to check if it's public
  let wasPublic = false;
  try {
    const existingSet = await getFlashcardSet(setId);
    wasPublic = existingSet.isPublic;
  } catch {
    // If we can't get the set, proceed with the update
  }

  const invalidateKeys = [
    CACHE_KEYS.FLASHCARD.SET(setId),
    CACHE_KEYS.FLASHCARD.USER_SETS(userId),
  ];

  // If public status is changing or it was public, invalidate public sets
  if (updates.isPublic !== undefined || wasPublic) {
    invalidateKeys.push(CACHE_KEYS.FLASHCARD.PUBLIC_SETS);
  }

  await cachedFetch({
    cacheKey: "",
    fetchData: () => updateFlashcardSetRepo(setId, userId, updates),
    invalidateKeys,
    logMessage: `Updating flashcard set: ${setId}`,
  });
}

/**
 * Deletes a flashcard set
 */
export async function deleteFlashcardSet(
  setId: FlashcardId,
  userId: UserId
): Promise<void> {
  // Check if set is public before deleting
  let isPublic = false;
  try {
    const set = await getFlashcardSet(setId);
    isPublic = set.isPublic;
  } catch {
    // If we can't get the set, assume it might be public to be safe
    isPublic = true;
  }

  const invalidateKeys = [
    CACHE_KEYS.FLASHCARD.SET(setId),
    CACHE_KEYS.FLASHCARD.USER_SETS(userId),
  ];

  if (isPublic) {
    invalidateKeys.push(CACHE_KEYS.FLASHCARD.PUBLIC_SETS);
  }

  await cachedFetch({
    cacheKey: "",
    fetchData: () => deleteFlashcardSetRepo(setId, userId),
    invalidateKeys,
    logMessage: `Deleting flashcard set: ${setId}`,
  });
}

/**
 * Gets all public flashcard sets
 */
export async function getPublicFlashcardSets(): Promise<FlashcardSet[]> {
  return cachedFetch({
    cacheKey: CACHE_KEYS.FLASHCARD.PUBLIC_SETS,
    fetchData: async () => {
      const sets = await getPublicFlashcardSetsRepo();

      // Cache individual sets for faster access later
      sets.forEach((set) => {
        setCache(CACHE_KEYS.FLASHCARD.SET(set.id), set);
      });

      return sets;
    },
    logMessage: "Fetching public flashcard sets",
  });
}

/**
 * Get cache statistics for monitoring
 */
export function getFlashcardCacheStats() {
  return getStats();
}
