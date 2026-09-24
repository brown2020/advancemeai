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
  increment,
  limit,
  FirestoreError,
  DocumentData,
} from "firebase/firestore";
import { getClientDb } from "@/config/firebase";
import {
  FlashcardSet,
  FlashcardId,
  UserId,
  FlashcardFormData,
  type FlashcardVisibility,
} from "@/types/flashcard";
import {
  normalizeVisibility,
  visibilityToStorageFields,
} from "@/lib/flashcard-visibility";
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
const flashcardSetsCollection = () => collection(getClientDb(), COLLECTION_NAME);

/**
 * Converts Firestore document to FlashcardSet
 */
function documentToFlashcardSet(id: string, data: DocumentData): FlashcardSet {
  const visibility = normalizeVisibility(data);
  const { isPublic } = visibilityToStorageFields(visibility);

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
    isPublic,
    visibility,
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
  visibility: FlashcardVisibility
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

    const cardsWithIds = cards.map((card) => {
      const next: Record<string, unknown> = {
        term: card.term.trim(),
        definition: card.definition.trim(),
        id: crypto.randomUUID(),
        createdAt: Date.now(),
      };
      // Firestore rejects undefined field values.
      if (card.termImageUrl) next.termImageUrl = card.termImageUrl;
      if (card.definitionImageUrl) next.definitionImageUrl = card.definitionImageUrl;
      return next;
    });

    const visibilityFields = visibilityToStorageFields(visibility);

    const docRef = await addDoc(flashcardSetsCollection(), {
      title: title.trim(),
      description: description.trim(),
      cards: cardsWithIds,
      userId,
      createdAt: timestamp,
      updatedAt: timestamp,
      ...visibilityFields,
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
      flashcardSetsCollection(),
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

    const docRef = doc(flashcardSetsCollection(), setId);
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

    const docRef = doc(flashcardSetsCollection(), setId);
    const payload: Record<string, unknown> = { ...updates };

    if (updates.visibility !== undefined || updates.isPublic !== undefined) {
      const nextVisibility =
        updates.visibility ?? (updates.isPublic ? "public" : "private");
      Object.assign(payload, visibilityToStorageFields(nextVisibility));
    }

    // Firestore rejects undefined field values (including nested card image urls).
    const sanitized = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined)
    );
    if (Array.isArray(sanitized.cards)) {
      sanitized.cards = sanitized.cards.map((card) => {
        if (!card || typeof card !== "object") return card;
        return Object.fromEntries(
          Object.entries(card as Record<string, unknown>).filter(
            ([, value]) => value !== undefined
          )
        );
      });
    }

    await updateDoc(docRef, {
      ...sanitized,
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

    const docRef = doc(flashcardSetsCollection(), setId);
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
 * Increments global study count on a flashcard set (any user completing a session).
 */
export async function incrementFlashcardSetTimesStudied(
  setId: FlashcardId
): Promise<void> {
  try {
    const docRef = doc(flashcardSetsCollection(), setId);
    await updateDoc(docRef, {
      timesStudied: increment(1),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to update study count", ErrorType.UNKNOWN);
  }
}

/**
 * Gets public flashcard sets
 */
export async function getPublicFlashcardSets(): Promise<FlashcardSet[]> {
  try {
    logger.info("Fetching public flashcard sets");

    const q = query(
      flashcardSetsCollection(),
      where("isPublic", "==", true),
      orderBy("updatedAt", "desc"),
      limit(50)
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs
      .map((doc) => documentToFlashcardSet(doc.id, doc.data()))
      .filter((set) => set.visibility === "public");
  } catch (error) {
    logger.error("Error getting public flashcard sets:", error);
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to get public flashcard sets", ErrorType.UNKNOWN);
  }
}
