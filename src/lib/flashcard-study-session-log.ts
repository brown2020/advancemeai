import {
  MAX_FLASHCARD_SESSION_LOGS,
  type FlashcardStudySessionLog,
} from "@/types/flashcard-study-progress";
import { toMillis } from "@/lib/server-firestore";

export function parseRecentSessions(value: unknown): FlashcardStudySessionLog[] {
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

export function appendRecentSession(
  value: unknown,
  session: FlashcardStudySessionLog,
  maxLogs = MAX_FLASHCARD_SESSION_LOGS
): FlashcardStudySessionLog[] {
  return [
    ...parseRecentSessions(value),
    {
      completedAt: Math.max(1, Math.floor(session.completedAt)),
      durationSeconds: Math.max(1, Math.floor(session.durationSeconds)),
    },
  ].slice(-maxLogs);
}
