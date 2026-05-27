import { listUserPracticeAttempts } from "@/api/firebase/practiceProgressRepository";
import { buildProgressAnalytics } from "@/lib/progress-analytics";
import type { ProgressAnalyticsData } from "@/lib/progress-analytics";
import { getUserFlashcardSets } from "@/services/flashcardService";
import { listFlashcardStudyProgressForUser } from "@/services/flashcardStudyService";
import { logger } from "@/utils/logger";

export type { ProgressAnalyticsData };

/**
 * Loads progress analytics for the signed-in user from Firestore study records.
 */
export async function loadUserProgressAnalytics(
  userId: string
): Promise<ProgressAnalyticsData> {
  try {
    const [attempts, progressList, sets] = await Promise.all([
      listUserPracticeAttempts(userId).catch((error) => {
        logger.warn("Progress analytics: practice attempts unavailable", error);
        return [];
      }),
      listFlashcardStudyProgressForUser(userId).catch(() => []),
      getUserFlashcardSets(userId).catch(() => []),
    ]);

    return buildProgressAnalytics(attempts, progressList, sets);
  } catch (error) {
    logger.error("Failed to load progress analytics:", error);
    throw error;
  }
}
