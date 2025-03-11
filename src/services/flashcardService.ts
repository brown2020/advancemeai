import { db } from "@/firebase/firebaseConfig";
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
} from "firebase/firestore";
import { FlashcardSet, Flashcard } from "@/types/flashcard";

// Collection references
const flashcardSetsCollection = collection(db, "flashcardSets");

// Create a new flashcard set
export const createFlashcardSet = async (
  userId: string,
  title: string,
  description: string,
  cards: Omit<Flashcard, "id" | "createdAt">[],
  isPublic: boolean
): Promise<string> => {
  try {
    // Basic validation
    if (!userId) throw new Error("User ID is required");
    if (!title.trim()) throw new Error("Title is required");
    if (cards.length < 2) throw new Error("At least 2 cards are required");

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

    return docRef.id;
  } catch (error) {
    console.error("Error creating flashcard set:", error);
    throw error;
  }
};

// Get all flashcard sets for a user
export const getUserFlashcardSets = async (
  userId: string
): Promise<FlashcardSet[]> => {
  try {
    const q = query(
      flashcardSetsCollection,
      where("userId", "==", userId),
      orderBy("updatedAt", "desc"),
      limit(50)
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        cards: data.cards,
        userId: data.userId,
        createdAt: data.createdAt?.toMillis() || Date.now(),
        updatedAt: data.updatedAt?.toMillis() || Date.now(),
        isPublic: data.isPublic,
      };
    });
  } catch (error) {
    console.error("Error getting user flashcard sets:", error);
    throw error;
  }
};

// Get a specific flashcard set by ID
export const getFlashcardSet = async (
  setId: string
): Promise<FlashcardSet | null> => {
  try {
    const docRef = doc(flashcardSetsCollection, setId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      title: data.title,
      description: data.description,
      cards: data.cards,
      userId: data.userId,
      createdAt: data.createdAt?.toMillis() || Date.now(),
      updatedAt: data.updatedAt?.toMillis() || Date.now(),
      isPublic: data.isPublic,
    };
  } catch (error) {
    console.error("Error getting flashcard set:", error);
    throw error;
  }
};

// Update a flashcard set
export const updateFlashcardSet = async (
  setId: string,
  updates: Partial<Omit<FlashcardSet, "id" | "userId" | "createdAt">>
): Promise<void> => {
  try {
    const docRef = doc(flashcardSetsCollection, setId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating flashcard set:", error);
    throw error;
  }
};

// Delete a flashcard set
export const deleteFlashcardSet = async (setId: string): Promise<void> => {
  try {
    const docRef = doc(flashcardSetsCollection, setId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting flashcard set:", error);
    throw error;
  }
};

// Get public flashcard sets
export const getPublicFlashcardSets = async (): Promise<FlashcardSet[]> => {
  try {
    const q = query(
      flashcardSetsCollection,
      where("isPublic", "==", true),
      orderBy("updatedAt", "desc")
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        description: data.description,
        cards: data.cards,
        userId: data.userId,
        createdAt: data.createdAt?.toMillis() || Date.now(),
        updatedAt: data.updatedAt?.toMillis() || Date.now(),
        isPublic: data.isPublic,
      };
    });
  } catch (error) {
    console.error("Error getting public flashcard sets:", error);
    throw error;
  }
};
