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
  return measureAsyncPerformance(
    () => createFlashcardSetRepo(userId, title, description, cards, isPublic),
    "createFlashcardSet"
  );
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
  return measureAsyncPerformance(
    () => getFlashcardSetRepo(setId),
    "getFlashcardSet"
  );
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
  return measureAsyncPerformance(
    () => updateFlashcardSetRepo(setId, userId, updates),
    "updateFlashcardSet"
  );
}

/**
 * Deletes a flashcard set
 */
export async function deleteFlashcardSet(
  setId: FlashcardId,
  userId: UserId
): Promise<void> {
  logger.info(`Deleting flashcard set: ${setId}`);
  return measureAsyncPerformance(
    () => deleteFlashcardSetRepo(setId, userId),
    "deleteFlashcardSet"
  );
}

/**
 * Gets all public flashcard sets
 */
export async function getPublicFlashcardSets(): Promise<FlashcardSet[]> {
  logger.info("Fetching public flashcard sets");
  return measureAsyncPerformance(
    () => getPublicFlashcardSetsRepo(),
    "getPublicFlashcardSets"
  );
}
