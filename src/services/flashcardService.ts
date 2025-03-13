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
} from "@/models/flashcard";
import { logger } from "@/utils/logger";
import { measureAsyncPerformance } from "@/utils/performance";
import { Cache } from "@/utils/cache";

// Cache keys
const USER_SETS_PREFIX = "user-sets:";
const PUBLIC_SETS_KEY = "public-sets";
const SET_PREFIX = "set:";

// Create a cache for flashcard sets with a longer expiration for better performance
const flashcardCache = new Cache<string, FlashcardSet | FlashcardSet[]>({
  expirationMs: 10 * 60 * 1000, // 10 minutes
  enableLogs: process.env.NODE_ENV === "development",
  maxSize: 200, // Limit cache size to prevent memory issues
});

// Pending promises for deduplication of in-flight requests
const pendingPromises: Record<string, Promise<any>> = {};

/**
 * Get the cache key for a user's flashcard sets
 */
function getUserSetsKey(userId: UserId): string {
  return `${USER_SETS_PREFIX}${userId}`;
}

/**
 * Get the cache key for a specific flashcard set
 */
function getSetKey(setId: FlashcardId): string {
  return `${SET_PREFIX}${setId}`;
}

/**
 * Deduplicate in-flight requests to prevent redundant API calls
 */
async function deduplicateRequest<T>(
  key: string,
  factory: () => Promise<T>
): Promise<T> {
  // If there's already a pending request for this key, return that promise
  if (key in pendingPromises) {
    return pendingPromises[key] as Promise<T>;
  }

  // Otherwise, create a new promise and store it
  const promise = factory().finally(() => {
    // Clean up after the promise resolves or rejects
    delete pendingPromises[key];
  });

  pendingPromises[key] = promise;
  return promise;
}

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
  logger.info(`Creating flashcard set for user: ${userId}`);
  const setId = await measureAsyncPerformance(
    () => createFlashcardSetRepo(userId, title, description, cards, isPublic),
    "createFlashcardSet"
  );

  // Invalidate user's flashcard sets cache
  flashcardCache.remove(getUserSetsKey(userId));

  // If public, also invalidate public sets cache
  if (isPublic) {
    flashcardCache.remove(PUBLIC_SETS_KEY);
  }

  return setId;
}

/**
 * Gets all flashcard sets for a user
 */
export async function getUserFlashcardSets(
  userId: UserId
): Promise<FlashcardSet[]> {
  logger.info(`Fetching flashcard sets for user: ${userId}`);
  const cacheKey = getUserSetsKey(userId);

  return deduplicateRequest(cacheKey, () =>
    flashcardCache.getOrSet(cacheKey, async () => {
      const sets = await measureAsyncPerformance(
        () => getUserFlashcardSetsRepo(userId),
        "getUserFlashcardSets"
      );

      // Cache individual sets for faster access later
      sets.forEach((set) => {
        flashcardCache.set(getSetKey(set.id), set);
      });

      return sets;
    })
  ) as Promise<FlashcardSet[]>;
}

/**
 * Gets a specific flashcard set by ID
 */
export async function getFlashcardSet(
  setId: FlashcardId
): Promise<FlashcardSet> {
  logger.info(`Fetching flashcard set: ${setId}`);
  const cacheKey = getSetKey(setId);

  return deduplicateRequest(cacheKey, () =>
    flashcardCache.getOrSet(cacheKey, async () => {
      const set = await measureAsyncPerformance(
        () => getFlashcardSetRepo(setId),
        "getFlashcardSet"
      );
      return set;
    })
  ) as Promise<FlashcardSet>;
}

/**
 * Prefetches a flashcard set by ID (for optimistic loading)
 * This doesn't throw errors if the set doesn't exist
 */
export async function prefetchFlashcardSet(setId: FlashcardId): Promise<void> {
  const cacheKey = getSetKey(setId);

  // If already in cache or being fetched, don't do anything
  if (flashcardCache.has(cacheKey) || cacheKey in pendingPromises) {
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
  logger.info(`Updating flashcard set: ${setId}`);

  // Get the set before updating to check if it's public
  let wasPublic = false;
  try {
    const existingSet = await getFlashcardSet(setId);
    wasPublic = existingSet.isPublic;
  } catch (error) {
    // If we can't get the set, proceed with the update
  }

  await measureAsyncPerformance(
    () => updateFlashcardSetRepo(setId, userId, updates),
    "updateFlashcardSet"
  );

  // Invalidate related caches
  const setKey = getSetKey(setId);
  flashcardCache.remove(setKey);
  flashcardCache.remove(getUserSetsKey(userId));

  // If public status is changing or it was public, invalidate public sets
  if (updates.isPublic !== undefined || wasPublic) {
    flashcardCache.remove(PUBLIC_SETS_KEY);
  }
}

/**
 * Deletes a flashcard set
 */
export async function deleteFlashcardSet(
  setId: FlashcardId,
  userId: UserId
): Promise<void> {
  logger.info(`Deleting flashcard set: ${setId}`);

  // Check if set is public before deleting (to know if we need to invalidate public cache)
  let isPublic = false;
  try {
    const set = await getFlashcardSet(setId);
    isPublic = set.isPublic;
  } catch (error) {
    // If we can't get the set, assume it might be public to be safe
    isPublic = true;
  }

  await measureAsyncPerformance(
    () => deleteFlashcardSetRepo(setId, userId),
    "deleteFlashcardSet"
  );

  // Invalidate related caches
  flashcardCache.remove(getSetKey(setId));
  flashcardCache.remove(getUserSetsKey(userId));

  if (isPublic) {
    flashcardCache.remove(PUBLIC_SETS_KEY);
  }
}

/**
 * Gets all public flashcard sets
 */
export async function getPublicFlashcardSets(): Promise<FlashcardSet[]> {
  logger.info("Fetching public flashcard sets");

  return deduplicateRequest(PUBLIC_SETS_KEY, () =>
    flashcardCache.getOrSet(PUBLIC_SETS_KEY, async () => {
      const sets = await measureAsyncPerformance(
        () => getPublicFlashcardSetsRepo(),
        "getPublicFlashcardSets"
      );

      // Cache individual sets for faster access later
      sets.forEach((set) => {
        flashcardCache.set(getSetKey(set.id), set);
      });

      return sets;
    })
  ) as Promise<FlashcardSet[]>;
}

/**
 * Get cache statistics for monitoring
 */
export function getFlashcardCacheStats() {
  return flashcardCache.getStats();
}
