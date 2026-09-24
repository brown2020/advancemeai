import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  type FieldValue,
} from "firebase/firestore";
import { getClientDb } from "@/config/firebase";
import { toMillis } from "@/utils/timestamp";
import {
  appendRecentSession,
  parseRecentSessions,
} from "@/lib/flashcard-study-session-log";
import type { FlashcardStudySessionLog } from "@/types/flashcard-study-progress";
import { rethrowAsAppError } from "@/utils/errorUtils";

type FlashcardStudyProgressDoc = {
  userId: string;
  setId: string;
  masteryByCardId: Record<string, 0 | 1 | 2 | 3>;
  recentSessions?: FlashcardStudySessionLog[];
  updatedAt: FieldValue | null;
};

function progressDocRef(userId: string, setId: string) {
  // Stored under /users/{userId}/... so existing rules apply (owner-only)
  return doc(getClientDb(), "users", userId, "flashcardStudyProgress", setId);
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
    rethrowAsAppError(error, "Failed to load flashcard study progress");
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
    rethrowAsAppError(error, "Failed to save flashcard study progress");
  }
}

/**
 * Appends a completed study session duration to the set progress doc.
 */
export async function appendFlashcardStudySession(args: {
  userId: string;
  setId: string;
  durationSeconds: number;
}) {
  try {
    const ref = progressDocRef(args.userId, args.setId);
    const completedAt = Date.now();

    await runTransaction(getClientDb(), async (transaction) => {
      const snap = await transaction.get(ref);
      const existing = snap.exists()
        ? (snap.data() as FlashcardStudyProgressDoc)
        : null;

      transaction.set(
        ref,
        {
          userId: args.userId,
          setId: args.setId,
          masteryByCardId: existing?.masteryByCardId ?? {},
          recentSessions: appendRecentSession(existing?.recentSessions, {
            completedAt,
            durationSeconds: args.durationSeconds,
          }),
          updatedAt: serverTimestamp(),
        } satisfies FlashcardStudyProgressDoc,
        { merge: true }
      );
    });
  } catch (error) {
    rethrowAsAppError(error, "Failed to record flashcard study session");
  }
}

export async function listFlashcardStudyProgressForUser(userId: string) {
  try {
    const col = collection(getClientDb(), "users", userId, "flashcardStudyProgress");
    const q = query(col, limit(250));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data() as FlashcardStudyProgressDoc;
      return {
        setId: d.id,
        masteryByCardId: (data.masteryByCardId ?? {}) as Record<string, 0 | 1 | 2 | 3>,
        updatedAt: toMillis(data.updatedAt),
        recentSessions: parseRecentSessions(data.recentSessions),
      };
    });
  } catch (error) {
    rethrowAsAppError(error, "Failed to load flashcard study progress list");
  }
}

