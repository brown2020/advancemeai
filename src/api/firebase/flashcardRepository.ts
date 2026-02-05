import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  limit,
  FirestoreError,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import {
  FlashcardSet,
  FlashcardId,
  UserId,
  FlashcardFormData,
} from "@/types/flashcard";
import {
  AppError,
  ErrorType,
  createNotFoundError,
  logError,
} from "@/utils/errorUtils";
import { logger } from "@/utils/logger";
import { timestampToNumberOrNow } from "@/utils/timestamp";

// Collection reference
const COLLECTION_NAME = "flashcardSets";
const flashcardSetsCollection = collection(db, COLLECTION_NAME);

/**
 * Converts Firestore document to FlashcardSet
 */
function documentToFlashcardSet(id: string, data: DocumentData): FlashcardSet {
  return {
    id,
    title: data.title || "",
    description: data.description || "",
    cards: Array.isArray(data.cards)
      ? data.cards.map((card: DocumentData) => ({
          id: card.id || "",
          term: card.term || "",
          definition: card.definition || "",
          termImageUrl: card.termImageUrl || undefined,
          definitionImageUrl: card.definitionImageUrl || undefined,
          createdAt: timestampToNumberOrNow(card.createdAt),
        }))
      : [],
    userId: data.userId || "",
    createdAt: timestampToNumberOrNow(data.createdAt),
    updatedAt: timestampToNumberOrNow(data.updatedAt),
    isPublic: Boolean(data.isPublic),
    visibility: data.visibility || undefined,
    termLanguage: data.termLanguage || undefined,
    definitionLanguage: data.definitionLanguage || undefined,
    subjects: data.subjects || undefined,
    timesStudied: data.timesStudied || undefined,
    copiedFromSetId: data.copiedFromSetId || undefined,
    copiedFromUserId: data.copiedFromUserId || undefined,
  };
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
  try {
    // Validation
    if (!userId) {
      throw new AppError("User ID is required", ErrorType.VALIDATION);
    }

    if (!title.trim()) {
      throw new AppError("Title is required", ErrorType.VALIDATION);
    }

    if (cards.length < 2) {
      throw new AppError("At least 2 cards are required", ErrorType.VALIDATION);
    }

    if (cards.some((card) => !card.term.trim() || !card.definition.trim())) {
      throw new AppError(
        "All cards must have both a term and definition",
        ErrorType.VALIDATION
      );
    }

    const timestamp = serverTimestamp();

    const cardsWithIds = cards.map((card) => ({
      ...card,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    }));

    const docRef = await addDoc(flashcardSetsCollection, {
      title: title.trim(),
      description: description.trim(),
      cards: cardsWithIds,
      userId,
      createdAt: timestamp,
      updatedAt: timestamp,
      isPublic,
    });

    logger.info(`Created flashcard set with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    logger.error("Error creating flashcard set:", error);

    if (error instanceof FirestoreError) {
      throw new AppError(`Database error: ${error.message}`, ErrorType.SERVER);
    }

    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("An unexpected error occurred", ErrorType.UNKNOWN);
  }
}

/**
 * Gets all flashcard sets for a user
 */
export async function getUserFlashcardSets(
  userId: UserId
): Promise<FlashcardSet[]> {
  try {
    logger.info(`Fetching flashcard sets for user: ${userId}`);

    const q = query(
      flashcardSetsCollection,
      where("userId", "==", userId),
      orderBy("updatedAt", "desc"),
      limit(50)
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) =>
      documentToFlashcardSet(doc.id, doc.data())
    );
  } catch (error) {
    logger.error("Error getting user flashcard sets:", error);
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to get flashcard sets", ErrorType.UNKNOWN);
  }
}

/**
 * Gets a specific flashcard set by ID
 */
export async function getFlashcardSet(
  setId: FlashcardId
): Promise<FlashcardSet> {
  try {
    logger.info(`Fetching flashcard set: ${setId}`);

    const docRef = doc(flashcardSetsCollection, setId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw createNotFoundError("Flashcard set");
    }

    return documentToFlashcardSet(docSnap.id, docSnap.data());
  } catch (error) {
    logger.error("Error getting flashcard set:", error);
    if (error instanceof AppError) {
      throw error;
    }
    logError(error);
    throw new AppError(
      error instanceof Error
        ? `Database error: ${error.message}`
        : "Unknown database error",
      ErrorType.SERVER
    );
  }
}

/**
 * Gets multiple flashcard sets by IDs
 * Useful for batch operations like folder visibility calculation
 */
export async function getFlashcardSetsByIds(
  setIds: FlashcardId[]
): Promise<FlashcardSet[]> {
  if (setIds.length === 0) return [];

  try {
    logger.info(`Fetching ${setIds.length} flashcard sets by IDs`);

    // Firestore 'in' queries are limited to 30 items, so we batch them
    const batchSize = 30;
    const results: FlashcardSet[] = [];

    for (let i = 0; i < setIds.length; i += batchSize) {
      const batch = setIds.slice(i, i + batchSize);
      const q = query(flashcardSetsCollection, where("__name__", "in", batch));
      const querySnapshot = await getDocs(q);

      querySnapshot.docs.forEach((doc) => {
        results.push(documentToFlashcardSet(doc.id, doc.data()));
      });
    }

    return results;
  } catch (error) {
    logger.error("Error getting flashcard sets by IDs:", error);
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to get flashcard sets", ErrorType.UNKNOWN);
  }
}

/**
 * Updates a flashcard set
 */
export async function updateFlashcardSet(
  setId: FlashcardId,
  userId: UserId,
  updates: Partial<Omit<FlashcardSet, "id" | "userId" | "createdAt">>
): Promise<void> {
  try {
    logger.info(`Updating flashcard set: ${setId}`);

    // Verify ownership
    const existingSet = await getFlashcardSet(setId);
    if (existingSet.userId !== userId) {
      throw new AppError(
        "You don't have permission to update this flashcard set",
        ErrorType.AUTHORIZATION
      );
    }

    const docRef = doc(flashcardSetsCollection, setId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    logger.info(`Updated flashcard set: ${setId}`);
  } catch (error) {
    logger.error(`Error updating flashcard set ${setId}:`, error);
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to update flashcard set", ErrorType.UNKNOWN);
  }
}

/**
 * Deletes a flashcard set
 */
export async function deleteFlashcardSet(
  setId: FlashcardId,
  userId: UserId
): Promise<void> {
  try {
    logger.info(`Deleting flashcard set: ${setId}`);

    // Verify ownership
    const existingSet = await getFlashcardSet(setId);
    if (existingSet.userId !== userId) {
      throw new AppError(
        "You don't have permission to delete this flashcard set",
        ErrorType.AUTHORIZATION
      );
    }

    const docRef = doc(flashcardSetsCollection, setId);
    await deleteDoc(docRef);

    logger.info(`Deleted flashcard set: ${setId}`);
  } catch (error) {
    logger.error(`Error deleting flashcard set ${setId}:`, error);
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to delete flashcard set", ErrorType.UNKNOWN);
  }
}

/**
 * Gets public flashcard sets
 */
export async function getPublicFlashcardSets(): Promise<FlashcardSet[]> {
  try {
    logger.info("Fetching public flashcard sets");

    const q = query(
      flashcardSetsCollection,
      where("isPublic", "==", true),
      orderBy("updatedAt", "desc"),
      limit(50)
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) =>
      documentToFlashcardSet(doc.id, doc.data())
    );
  } catch (error) {
    logger.error("Error getting public flashcard sets:", error);
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to get public flashcard sets", ErrorType.UNKNOWN);
  }
}
