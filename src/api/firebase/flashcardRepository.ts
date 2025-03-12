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
  Timestamp,
  writeBatch,
  FirestoreError,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import {
  FlashcardSet,
  FlashcardId,
  UserId,
  FlashcardFormData,
} from "@/models/flashcard";
import {
  AppError,
  ErrorCode,
  createNotFoundError,
  handleError,
} from "@/utils/errors";
import { logger } from "@/utils/logger";

// Collection reference
const COLLECTION_NAME = "flashcardSets";
const flashcardSetsCollection = collection(db, COLLECTION_NAME);

/**
 * Converts Firestore timestamp to number
 */
function timestampToNumber(timestamp: unknown): number {
  if (timestamp instanceof Timestamp) {
    return timestamp.toMillis();
  }

  if (
    timestamp &&
    typeof timestamp === "object" &&
    "toMillis" in timestamp &&
    typeof (timestamp as { toMillis: () => number }).toMillis === "function"
  ) {
    return (timestamp as { toMillis: () => number }).toMillis();
  }

  if (typeof timestamp === "number") {
    return timestamp;
  }

  return Date.now();
}

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
          createdAt: timestampToNumber(card.createdAt),
        }))
      : [],
    userId: data.userId || "",
    createdAt: timestampToNumber(data.createdAt),
    updatedAt: timestampToNumber(data.updatedAt),
    isPublic: Boolean(data.isPublic),
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
      throw new AppError("User ID is required", ErrorCode.VALIDATION, 400);
    }

    if (!title.trim()) {
      throw new AppError("Title is required", ErrorCode.VALIDATION, 400);
    }

    if (cards.length < 2) {
      throw new AppError(
        "At least 2 cards are required",
        ErrorCode.VALIDATION,
        400
      );
    }

    if (cards.some((card) => !card.term.trim() || !card.definition.trim())) {
      throw new AppError(
        "All cards must have both a term and definition",
        ErrorCode.VALIDATION,
        400
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
      throw new AppError(
        `Database error: ${error.message}`,
        ErrorCode.SERVER_ERROR,
        500
      );
    }

    throw handleError(error);
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
    throw handleError(error);
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
    if (error instanceof Error) {
      throw new AppError(
        `Database error: ${error.message}`,
        ErrorCode.SERVER_ERROR,
        500
      );
    }
    throw new AppError("Unknown database error", ErrorCode.SERVER_ERROR, 500);
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
        ErrorCode.AUTHORIZATION,
        403
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
    throw handleError(error);
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
        ErrorCode.AUTHORIZATION,
        403
      );
    }

    const docRef = doc(flashcardSetsCollection, setId);
    await deleteDoc(docRef);

    logger.info(`Deleted flashcard set: ${setId}`);
  } catch (error) {
    logger.error(`Error deleting flashcard set ${setId}:`, error);
    throw handleError(error);
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
    throw handleError(error);
  }
}

/**
 * Batch operations for flashcard sets
 */
export async function batchUpdateFlashcardSets(
  operations: Array<{
    id: FlashcardId;
    userId: UserId;
    updates: Partial<Omit<FlashcardSet, "id" | "userId" | "createdAt">>;
  }>
): Promise<void> {
  try {
    logger.info(`Batch updating ${operations.length} flashcard sets`);

    if (operations.length === 0) {
      logger.info("No operations to perform in batch update");
      return;
    }

    const batch = writeBatch(db);

    // Get all set IDs to fetch in a single operation
    const setIds = operations.map((op) => op.id);

    // Create a map of userId to setId for quick ownership verification
    const userIdMap = new Map<string, string>();
    operations.forEach((op) => userIdMap.set(op.id, op.userId));

    // Fetch all documents in parallel
    const fetchPromises = setIds.map((id) => {
      const docRef = doc(flashcardSetsCollection, id);
      return getDoc(docRef);
    });

    const docSnapshots = await Promise.all(fetchPromises);

    // Verify ownership and prepare batch operations
    for (const docSnap of docSnapshots) {
      if (!docSnap.exists()) {
        throw createNotFoundError(`Flashcard set ${docSnap.id}`);
      }

      const data = docSnap.data();
      const expectedUserId = userIdMap.get(docSnap.id);

      if (data.userId !== expectedUserId) {
        throw new AppError(
          `You don't have permission to update flashcard set ${docSnap.id}`,
          ErrorCode.AUTHORIZATION,
          403
        );
      }

      // Find the corresponding operation
      const operation = operations.find((op) => op.id === docSnap.id);
      if (operation) {
        const docRef = doc(flashcardSetsCollection, docSnap.id);
        batch.update(docRef, {
          ...operation.updates,
          updatedAt: serverTimestamp(),
        });
      }
    }

    await batch.commit();
    logger.info(
      `Successfully batch updated ${operations.length} flashcard sets`
    );
  } catch (error) {
    logger.error("Error in batch update operation:", error);
    throw handleError(error);
  }
}
