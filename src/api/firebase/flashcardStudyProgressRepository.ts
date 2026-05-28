import { collection, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, type FieldValue } from "firebase/firestore";
import { db } from "@/config/firebase";
import { toMillis } from "@/lib/server-firestore";
import {
  MAX_FLASHCARD_SESSION_LOGS,
  type FlashcardStudySessionLog,
} from "@/types/flashcard-study-progress";
import { AppError, ErrorType, logError } from "@/utils/errorUtils";

export type FlashcardStudyProgressDoc = {
  userId: string;
  setId: string;
  masteryByCardId: Record<string, 0 | 1 | 2 | 3>;
  recentSessions?: FlashcardStudySessionLog[];
  updatedAt: FieldValue | null;
};

function parseRecentSessions(value: unknown): FlashcardStudySessionLog[] {
  if (!Array.isArray(value)) return [];
  const sessions: FlashcardStudySessionLog[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const completedAt = toMillis(row.completedAt);
    const durationSeconds =
      typeof row.durationSeconds === "number" ? row.durationSeconds : 0;
    if (completedAt <= 0 || durationSeconds <= 0) continue;
    sessions.push({
      completedAt,
      durationSeconds: Math.floor(durationSeconds),
    });
  }
  return sessions;
}

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
    const snap = await getDoc(ref);
    const existing = snap.exists()
      ? (snap.data() as FlashcardStudyProgressDoc)
      : null;

    const durationSeconds = Math.max(1, Math.floor(args.durationSeconds));
    const completedAt = Date.now();
    const prevSessions = parseRecentSessions(existing?.recentSessions);
    const recentSessions = [
      ...prevSessions,
      { completedAt, durationSeconds },
    ].slice(-MAX_FLASHCARD_SESSION_LOGS);

    await setDoc(
      ref,
      {
        userId: args.userId,
        setId: args.setId,
        masteryByCardId: existing?.masteryByCardId ?? {},
        recentSessions,
        updatedAt: serverTimestamp(),
      } satisfies FlashcardStudyProgressDoc,
      { merge: true }
    );
  } catch (error) {
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to record flashcard study session", ErrorType.UNKNOWN);
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
        updatedAt: toMillis(data.updatedAt),
        recentSessions: parseRecentSessions(data.recentSessions),
      };
    });
  } catch (error) {
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to load flashcard study progress list", ErrorType.UNKNOWN);
  }
}


