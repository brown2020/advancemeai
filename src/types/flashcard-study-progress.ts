/** Logged when a user completes a flashcard study mode session */
export type FlashcardStudySessionLog = {
  completedAt: number;
  durationSeconds: number;
};

export const MAX_FLASHCARD_SESSION_LOGS = 60;
