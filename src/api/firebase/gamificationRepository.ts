import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getClientDb } from "@/config/firebase";
import { AppError, ErrorType, logError } from "@/utils/errorUtils";
import type { GamificationData, AchievementId } from "@/types/gamification";
import { createDefaultGamificationData } from "@/types/gamification";

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
      lastStudyDate: data.lastStudyDate?.toMillis() ?? null,
      achievements: (data.achievements ?? []) as AchievementId[],
      achievementDates: (data.achievementDates ?? {}) as Record<AchievementId, number>,
      totalCardsStudied: data.totalCardsStudied ?? 0,
      totalCardsMastered: data.totalCardsMastered ?? 0,
      totalQuestionsAnswered: data.totalQuestionsAnswered ?? 0,
      perfectScores: data.perfectScores ?? 0,
      totalStudySessions: data.totalStudySessions ?? 0,
      createdAt: data.createdAt?.toMillis() ?? Date.now(),
      updatedAt: data.updatedAt?.toMillis() ?? Date.now(),
    };
  } catch (error) {
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to load gamification data", ErrorType.UNKNOWN);
  }
}

/**
 * Save/update user's gamification data to Firestore
 */
export async function upsertGamificationData(
  data: Omit<GamificationData, "createdAt" | "updatedAt">
): Promise<void> {
  try {
    const ref = gamificationDocRef(data.userId);

    // Check if document exists for createdAt handling
    const snap = await getDoc(ref);
    const existingCreatedAt = snap.exists() ? snap.data().createdAt : serverTimestamp();

    await setDoc(
      ref,
      {
        ...data,
        createdAt: existingCreatedAt,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to save gamification data", ErrorType.UNKNOWN);
  }
}

/**
 * Initialize gamification data for a new user
 */
export async function initializeGamificationData(userId: string): Promise<GamificationData> {
  try {
    const existing = await getGamificationData(userId);
    if (existing) return existing;

    const defaultData = createDefaultGamificationData(userId);
    await upsertGamificationData(defaultData);

    return {
      ...defaultData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  } catch (error) {
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to initialize gamification data", ErrorType.UNKNOWN);
  }
}

/**
 * Unlock an achievement for a user
 */
export async function unlockAchievement(
  userId: string,
  achievementId: AchievementId
): Promise<boolean> {
  try {
    const current = await getGamificationData(userId);
    const achievements = current?.achievements ?? [];

    // Already unlocked
    if (achievements.includes(achievementId)) {
      return false;
    }

    await upsertGamificationData({
      ...(current ?? createDefaultGamificationData(userId)),
      achievements: [...achievements, achievementId],
      achievementDates: {
        ...(current?.achievementDates ?? {}),
        [achievementId]: Date.now(),
      } as Record<AchievementId, number>,
    });

    return true;
  } catch (error) {
    logError(error);
    throw error instanceof AppError
      ? error
      : new AppError("Failed to unlock achievement", ErrorType.UNKNOWN);
  }
}
