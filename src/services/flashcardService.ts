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

// Create a cache for individual flashcard sets
const singleSetCache = new Cache<FlashcardId, FlashcardSet>({
  expirationMs: 5 * 60 * 1000, // 5 minutes
});

// Create a cache for public flashcard sets
const publicSetsCache = new Cache<string, FlashcardSet[]>({
  expirationMs: 10 * 60 * 1000, // 10 minutes
});

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
  return setId;
}

/**
 * Gets all flashcard sets for a user
 */
export async function getUserFlashcardSets(
  userId: UserId
): Promise<FlashcardSet[]> {
  logger.info(`Fetching flashcard sets for user: ${userId}`);
  return measureAsyncPerformance(
    () => getUserFlashcardSetsRepo(userId),
    "getUserFlashcardSets"
  );
}

/**
 * Gets a specific flashcard set by ID
 */
export async function getFlashcardSet(
  setId: FlashcardId
): Promise<FlashcardSet> {
  logger.info(`Fetching flashcard set: ${setId}`);

  // Try to get from cache first
  const cachedSet = singleSetCache.get(setId);
  if (cachedSet) {
    return cachedSet;
  }

  // If not in cache, fetch from repository
  const set = await measureAsyncPerformance(
    () => getFlashcardSetRepo(setId),
    "getFlashcardSet"
  );

  // Cache the result
  singleSetCache.set(setId, set);

  return set;
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

  // Invalidate cache for this set
  singleSetCache.remove(setId);
}

/**
 * Deletes a flashcard set
 */
export async function deleteFlashcardSet(
  setId: FlashcardId,
  userId: UserId
): Promise<void> {
  logger.info(`Deleting flashcard set: ${setId}`);
  await measureAsyncPerformance(
    () => deleteFlashcardSetRepo(setId, userId),
    "deleteFlashcardSet"
  );

  // Invalidate cache for this set
  singleSetCache.remove(setId);
}

/**
 * Gets all public flashcard sets
 */
export async function getPublicFlashcardSets(): Promise<FlashcardSet[]> {
  logger.info("Fetching public flashcard sets");

  return publicSetsCache.getOrSet("public", () =>
    measureAsyncPerformance(
      () => getPublicFlashcardSetsRepo(),
      "getPublicFlashcardSets"
    )
  );
}
