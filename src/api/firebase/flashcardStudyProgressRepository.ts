import { collection, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { AppError, ErrorType, logError } from "@/utils/errorUtils";

export type FlashcardStudyProgressDoc = {
  userId: string;
  setId: string;
  masteryByCardId: Record<string, 0 | 1 | 2 | 3>;
  updatedAt: any;
};

function progressDocRef(userId: string, setId: string) {
  // Stored under /users/{userId}/... so existing rules apply (owner-only)
  return doc(db, "users", userId, "flashcardStudyProgress", setId);
}

export async function getFlashcardStudyProgress(userId: string, setId: string) {
  try {
    const ref = progressDocRef(userId, setId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data() as FlashcardStudyProgressDoc;
    return {
      masteryByCardId: (data.masteryByCardId ?? {}) as Record<string, 0 | 1 | 2 | 3>,
    };
  } catch (error) {
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to load flashcard study progress", ErrorType.UNKNOWN);
  }
}

export async function upsertFlashcardStudyProgress(args: {
  userId: string;
  setId: string;
  masteryByCardId: Record<string, 0 | 1 | 2 | 3>;
}) {
  try {
    const ref = progressDocRef(args.userId, args.setId);
    await setDoc(
      ref,
      {
        userId: args.userId,
        setId: args.setId,
        masteryByCardId: args.masteryByCardId,
        updatedAt: serverTimestamp(),
      } satisfies FlashcardStudyProgressDoc,
      { merge: true }
    );
  } catch (error) {
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to save flashcard study progress", ErrorType.UNKNOWN);
  }
}

export async function listFlashcardStudyProgressForUser(userId: string) {
  try {
    const col = collection(db, "users", userId, "flashcardStudyProgress");
    const q = query(col, limit(250));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data() as FlashcardStudyProgressDoc;
      return {
        setId: d.id,
        masteryByCardId: (data.masteryByCardId ?? {}) as Record<string, 0 | 1 | 2 | 3>,
      };
    });
  } catch (error) {
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to load flashcard study progress list", ErrorType.UNKNOWN);
  }
}


