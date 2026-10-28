import { doc, getDoc } from "firebase/firestore";
import { getClientDb } from "@/config/firebase";
import { rethrowAsAppError } from "@/utils/errorUtils";
import { toMillis } from "@/utils/timestamp";
import type { GamificationData, AchievementId } from "@/types/gamification";

/**
 * Get document reference for user's gamification data
 */
function gamificationDocRef(userId: string) {
  return doc(getClientDb(), "users", userId, "gamification", "data");
}

/**
 * Get user's gamification data from Firestore
 */
export async function getGamificationData(
  userId: string
): Promise<GamificationData | null> {
  try {
    const ref = gamificationDocRef(userId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return null;
    }

    const data = snap.data();
    return {
      userId: data.userId,
      xp: data.xp ?? 0,
      level: data.level ?? 1,
      currentStreak: data.currentStreak ?? 0,
      longestStreak: data.longestStreak ?? 0,
      lastStudyDate: data.lastStudyDate ? toMillis(data.lastStudyDate) : null,
      achievements: (data.achievements ?? []) as AchievementId[],
      achievementDates: (data.achievementDates ?? {}) as Record<AchievementId, number>,
      totalCardsStudied: data.totalCardsStudied ?? 0,
      totalCardsMastered: data.totalCardsMastered ?? 0,
      totalQuestionsAnswered: data.totalQuestionsAnswered ?? 0,
      perfectScores: data.perfectScores ?? 0,
      totalStudySessions: data.totalStudySessions ?? 0,
      createdAt: toMillis(data.createdAt) || Date.now(),
      updatedAt: toMillis(data.updatedAt) || Date.now(),
    };
  } catch (error) {
    rethrowAsAppError(error, "Failed to load gamification data");
  }
}

