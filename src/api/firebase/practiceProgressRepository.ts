import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "@/config/firebase";
import { toMillis } from "@/lib/server-firestore";

export type PracticeMode = "timed" | "review" | "micro";

export type PracticeAttempt = {
  userId: string;
  sectionId: string;
  questionId: string;
  mode: PracticeMode;
  difficulty?: "easy" | "medium" | "hard" | number;
  isCorrect: boolean;
  timeSpentMs: number;
  conceptId?: string;
};

export type PracticeAttemptRecord = PracticeAttempt & {
  id: string;
  createdAt: number;
};

type ConceptStats = {
  conceptId: string;
  total: number;
  correct: number;
  avgTimeMs: number;
};

const attemptsCollection = collection(db, "practiceAttempts");

export async function recordPracticeAttempt(attempt: PracticeAttempt) {
  await addDoc(attemptsCollection, {
    ...attempt,
    createdAt: serverTimestamp(),
  });
}

/**
 * Lists recent practice attempts for a user across all sections.
 */
export async function listUserPracticeAttempts(
  userId: string,
  limitCount = 500
): Promise<PracticeAttemptRecord[]> {
  const q = query(
    attemptsCollection,
    where("userId", "==", userId),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() as PracticeAttempt & {
      createdAt?: unknown;
    };
    return {
      id: docSnap.id,
      userId: data.userId,
      sectionId: data.sectionId,
      questionId: data.questionId,
      mode: data.mode,
      difficulty: data.difficulty,
      isCorrect: data.isCorrect,
      timeSpentMs: data.timeSpentMs ?? 0,
      conceptId: data.conceptId,
      createdAt: toMillis(data.createdAt),
    };
  });
}

export async function getRecentAttempts(
  userId: string,
  sectionId: string,
  limitCount = 50
) {
  const q = query(
    attemptsCollection,
    where("userId", "==", userId),
    where("sectionId", "==", sectionId),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as PracticeAttempt),
  }));
}

export async function getConceptSummaries(
  userId: string,
  sectionId: string
): Promise<ConceptStats[]> {
  const attempts = await getRecentAttempts(userId, sectionId, 200);
  const stats = new Map<string, ConceptStats>();

  attempts.forEach((attempt) => {
    const conceptId = attempt.conceptId || attempt.questionId;
    if (!stats.has(conceptId)) {
      stats.set(conceptId, {
        conceptId,
        total: 0,
        correct: 0,
        avgTimeMs: 0,
      });
    }

    const entry = stats.get(conceptId)!;
    const total = entry.total + 1;
    const correct = entry.correct + (attempt.isCorrect ? 1 : 0);
    const avgTime =
      (entry.avgTimeMs * entry.total + attempt.timeSpentMs) / total;

    stats.set(conceptId, {
      conceptId,
      total,
      correct,
      avgTimeMs: avgTime,
    });
  });

  return Array.from(stats.values()).sort((a, b) => a.correct - b.correct);
}
