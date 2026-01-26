import { getAdminDbOptional } from "@/config/firebase-admin";
import type {
  FullTestResults,
  FullTestSectionAttempt,
  FullTestSectionConfig,
  FullTestSession,
  FullTestSectionId,
} from "@/types/practice-test";

type FirestoreSession = Omit<FullTestSession, "id">;
type FirestoreResults = Omit<FullTestResults, "id">;

function getAdminDbOrThrow() {
  const db = getAdminDbOptional();
  if (!db) {
    throw new Error("Firestore admin is not configured");
  }
  return db;
}

export async function createSession(
  userId: string,
  sections: FullTestSectionConfig[]
): Promise<FullTestSession> {
  const db = getAdminDbOrThrow();
  const now = Date.now();
  const session: FirestoreSession = {
    userId,
    status: "in_progress",
    sections,
    createdAt: now,
    updatedAt: now,
  };

  const ref = await db.collection("practiceTestSessions").add(session);
  return { id: ref.id, ...session };
}

export async function getSession(
  sessionId: string
): Promise<FullTestSession | null> {
  const db = getAdminDbOrThrow();
  const snapshot = await db.collection("practiceTestSessions").doc(sessionId).get();
  if (!snapshot.exists) return null;
  const data = snapshot.data() as FirestoreSession;
  return { id: snapshot.id, ...data };
}

export async function upsertSectionAttempt(
  sessionId: string,
  attempt: FullTestSectionAttempt
) {
  const db = getAdminDbOrThrow();
  await db
    .collection("practiceTestSessions")
    .doc(sessionId)
    .collection("sectionAttempts")
    .doc(attempt.sectionId)
    .set({ ...attempt, updatedAt: Date.now() }, { merge: true });
}

export async function getSectionAttempts(
  sessionId: string
): Promise<FullTestSectionAttempt[]> {
  const db = getAdminDbOrThrow();
  const snapshot = await db
    .collection("practiceTestSessions")
    .doc(sessionId)
    .collection("sectionAttempts")
    .get();

  return snapshot.docs.map((doc) => doc.data() as FullTestSectionAttempt);
}

export async function saveResults(
  sessionId: string,
  results: Omit<FullTestResults, "id" | "sessionId">
): Promise<FullTestResults> {
  const db = getAdminDbOrThrow();
  const stored: FirestoreResults = {
    sessionId,
    ...results,
  };

  const ref = await db.collection("practiceTestResults").add(stored);
  await db.collection("practiceTestSessions").doc(sessionId).set(
    {
      status: "completed",
      updatedAt: Date.now(),
    },
    { merge: true }
  );

  return { id: ref.id, ...stored };
}

export async function getResultsBySession(
  sessionId: string
): Promise<FullTestResults | null> {
  const db = getAdminDbOrThrow();
  const snapshot = await db
    .collection("practiceTestResults")
    .where("sessionId", "==", sessionId)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  if (!doc) return null;
  return { id: doc.id, ...(doc.data() as FirestoreResults) };
}

export function assertSection(
  sections: FullTestSectionConfig[],
  sectionId: string
): sectionId is FullTestSectionId {
  return sections.some((section) => section.id === sectionId);
}
