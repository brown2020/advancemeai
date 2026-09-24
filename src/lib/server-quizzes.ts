import type { Firestore } from "firebase-admin/firestore";
import { isPublicFromData } from "@/lib/server-firestore";

export type QuizDoc = Record<string, unknown> & { id: string };

/** Max quizzes scanned per listing (Firestore has no OR query for public-or-owned) */
const QUIZ_SCAN_LIMIT = 100;

/**
 * Most recent quizzes the user can see: public quizzes (including legacy
 * docs without an `isPublic` field) plus the user's own.
 */
export async function listVisibleQuizzes(
  db: Firestore,
  userId: string | null
): Promise<QuizDoc[]> {
  const snapshot = await db
    .collection("quizzes")
    .orderBy("createdAt", "desc")
    .limit(QUIZ_SCAN_LIMIT)
    .get();

  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }))
    .filter((quiz) => isPublicFromData(quiz) || isQuizOwner(quiz, userId));
}

export function isQuizOwner(quiz: Record<string, unknown>, userId: string | null): boolean {
  return Boolean(userId) && quiz.userId === userId;
}
