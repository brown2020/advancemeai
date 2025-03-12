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

// Create a cache for flashcard sets with a longer expiration for better performance
const flashcardCache = new Cache<string, FlashcardSet | FlashcardSet[]>({
  expirationMs: 10 * 60 * 1000, // 10 minutes
  enableLogs: process.env.NODE_ENV === "development",
});

/**
 * Get the cache key for a user's flashcard sets
 */
function getUserSetsKey(userId: UserId): string {
  return `${USER_SETS_PREFIX}${userId}`;
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

  return flashcardCache.getOrSet(cacheKey, async () => {
    const sets = await measureAsyncPerformance(
      () => getUserFlashcardSetsRepo(userId),
      "getUserFlashcardSets"
    );
    return sets;
  }) as Promise<FlashcardSet[]>;
}

/**
 * Gets a specific flashcard set by ID
 */
export async function getFlashcardSet(
  setId: FlashcardId
): Promise<FlashcardSet> {
  logger.info(`Fetching flashcard set: ${setId}`);

  return flashcardCache.getOrSet(setId, async () => {
    const set = await measureAsyncPerformance(
      () => getFlashcardSetRepo(setId),
      "getFlashcardSet"
    );
    return set;
  }) as Promise<FlashcardSet>;
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
  await measureAsyncPerformance(
    () => updateFlashcardSetRepo(setId, userId, updates),
    "updateFlashcardSet"
  );

  // Invalidate related caches
  flashcardCache.remove(setId);
  flashcardCache.remove(getUserSetsKey(userId));

  // If public status is being changed or it might be public, invalidate public sets
  if (
    updates.isPublic !== undefined ||
    (await getFlashcardSet(setId)).isPublic
  ) {
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
  flashcardCache.remove(setId);
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

  return flashcardCache.getOrSet(PUBLIC_SETS_KEY, async () => {
    const sets = await measureAsyncPerformance(
      () => getPublicFlashcardSetsRepo(),
      "getPublicFlashcardSets"
    );
    return sets;
  }) as Promise<FlashcardSet[]>;
}
