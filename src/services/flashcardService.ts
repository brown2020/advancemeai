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
import { logger } from "@/utils/logger";
import { measureAsyncPerformance } from "@/utils/performance";
import { Cache } from "@/utils/cache";
import { CACHE_KEYS, CACHE_CONFIG } from "@/constants/appConstants";
import { deduplicateRequest } from "@/utils/request";

// Lazy-initialized cache for SSR safety
let flashcardCache: Cache<string, FlashcardSet | FlashcardSet[]> | null = null;

function getFlashcardCache(): Cache<string, FlashcardSet | FlashcardSet[]> {
  if (!flashcardCache) {
    flashcardCache = new Cache<string, FlashcardSet | FlashcardSet[]>({
      expirationMs: CACHE_CONFIG.expirationMs,
      enableLogs: process.env.NODE_ENV === "development",
      maxSize: CACHE_CONFIG.maxSize,
    });
  }
  return flashcardCache;
}

/**
 * Generic request handler that manages caching, deduplication and error handling
 */
async function handleRequest<T>(options: {
  cacheKey: string;
  fetchData: () => Promise<T>;
  invalidateKeys?: string[];
  logMessage?: string;
}): Promise<T> {
  const { cacheKey, fetchData, invalidateKeys = [], logMessage } = options;
  const cache = getFlashcardCache();

  // Log operation if message provided
  if (logMessage) {
    logger.info(logMessage);
  }

  // For operations that invalidate cache but don't fetch data
  if (!cacheKey) {
    try {
      const result = await measureAsyncPerformance(
        fetchData,
        logMessage || "flashcardOperation"
      );

      // Invalidate any specified cache keys
      invalidateKeys.forEach((key) => cache.remove(key));

      return result;
    } catch (error) {
      logger.error(`Error in flashcard operation: ${error}`);
      throw error;
    }
  }

  // Use shared deduplication utility
  return deduplicateRequest(cacheKey, async () => {
    return cache.getOrSet(cacheKey, async () => {
      const result = await fetchData();
      return result as unknown as FlashcardSet | FlashcardSet[];
    }) as Promise<T>;
  });
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
  const invalidateKeys = [CACHE_KEYS.FLASHCARD.USER_SETS(userId)];

  if (isPublic) {
    invalidateKeys.push(CACHE_KEYS.FLASHCARD.PUBLIC_SETS);
  }

  return handleRequest({
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

  return handleRequest({
    cacheKey,
    fetchData: async () => {
      const sets = await getUserFlashcardSetsRepo(userId);
      const cache = getFlashcardCache();

      // Cache individual sets for faster access later
      sets.forEach((set) => {
        cache.set(CACHE_KEYS.FLASHCARD.SET(set.id), set);
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
  return handleRequest({
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
  const cache = getFlashcardCache();

  // If already in cache, don't do anything
  if (cache.has(cacheKey)) {
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
  } catch (error) {
    // If we can't get the set, proceed with the update
    logger.warn(
      `Could not determine public status for set ${setId} before update`
    );
  }

  const invalidateKeys = [
    CACHE_KEYS.FLASHCARD.SET(setId),
    CACHE_KEYS.FLASHCARD.USER_SETS(userId),
  ];

  // If public status is changing or it was public, invalidate public sets
  if (updates.isPublic !== undefined || wasPublic) {
    invalidateKeys.push(CACHE_KEYS.FLASHCARD.PUBLIC_SETS);
  }

  await handleRequest({
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
  } catch (error) {
    // If we can't get the set, assume it might be public to be safe
    logger.warn(
      `Could not determine public status for set ${setId} before deletion`
    );
    isPublic = true;
  }

  const invalidateKeys = [
    CACHE_KEYS.FLASHCARD.SET(setId),
    CACHE_KEYS.FLASHCARD.USER_SETS(userId),
  ];

  if (isPublic) {
    invalidateKeys.push(CACHE_KEYS.FLASHCARD.PUBLIC_SETS);
  }

  await handleRequest({
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
  return handleRequest({
    cacheKey: CACHE_KEYS.FLASHCARD.PUBLIC_SETS,
    fetchData: async () => {
      const sets = await getPublicFlashcardSetsRepo();
      const cache = getFlashcardCache();

      // Cache individual sets for faster access later
      sets.forEach((set) => {
        cache.set(CACHE_KEYS.FLASHCARD.SET(set.id), set);
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
  return getFlashcardCache().getStats();
}
