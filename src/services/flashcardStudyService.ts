import { incrementFlashcardSetTimesStudied } from "@/api/firebase/flashcardRepository";
import { invalidateFlashcardSetCache } from "@/services/flashcardService";
import {
  appendFlashcardStudySession as appendSessionRepo,
  getFlashcardStudyProgress as getProgressRepo,
  listFlashcardStudyProgressForUser as listProgressRepo,
  upsertFlashcardStudyProgress as upsertProgressRepo,
} from "@/api/firebase/flashcardStudyProgressRepository";

export async function getFlashcardStudyProgress(userId: string, setId: string) {
  return getProgressRepo(userId, setId);
}

export async function saveFlashcardStudyProgress(args: {
  userId: string;
  setId: string;
  masteryByCardId: Record<string, 0 | 1 | 2 | 3>;
}) {
  return upsertProgressRepo(args);
}

export async function listFlashcardStudyProgressForUser(userId: string) {
  return listProgressRepo(userId);
}

export async function recordFlashcardStudySession(args: {
  userId: string;
  setId: string;
  durationSeconds: number;
}) {
  await appendSessionRepo(args);
  try {
    await incrementFlashcardSetTimesStudied(args.setId);
    invalidateFlashcardSetCache(args.setId);
  } catch {
    // Non-blocking: session log is the source of truth for the learner.
  }
}


