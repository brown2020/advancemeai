/**
 * Gamification Service
 * Business logic for XP, streaks, achievements, and levels
 */

import {
  getGamificationData as getGamificationRepo,
  upsertGamificationData as upsertGamificationRepo,
  initializeGamificationData as initGamificationRepo,
  unlockAchievement as unlockAchievementRepo,
} from "@/api/firebase/gamificationRepository";
import type {
  GamificationData,
  AchievementId,
  XPEventType,
} from "@/types/gamification";
import {
  XP_AMOUNTS,
  getLevelFromXP,
  getAchievementById,
} from "@/types/gamification";
import { createCachedService } from "@/utils/cachedService";

// Cache keys
const CACHE_KEYS = {
  userData: (userId: string) => `gamification:${userId}`,
};

// Create cached service instance
const { cachedFetch, invalidate } = createCachedService<GamificationData>(
  "gamification"
);

/**
 * Get user's gamification data
 */
export async function getGamificationData(
  userId: string
): Promise<GamificationData> {
  const data = await cachedFetch({
    cacheKey: CACHE_KEYS.userData(userId),
    fetchData: async () => {
      const result = await getGamificationRepo(userId);
      if (!result) {
        return initGamificationRepo(userId);
      }
      return result;
    },
    logMessage: `Fetching gamification data for user: ${userId}`,
  });

  return data;
}

/**
 * Save gamification data to server
 */
export async function saveGamificationData(
  data: Omit<GamificationData, "createdAt" | "updatedAt">
): Promise<void> {
  await cachedFetch({
    cacheKey: "",
    fetchData: () => upsertGamificationRepo(data),
    invalidateKeys: [CACHE_KEYS.userData(data.userId)],
    logMessage: `Saving gamification data for user: ${data.userId}`,
  });
}

/**
 * Award XP to a user for an action
 */
export async function awardXP(
  userId: string,
  eventType: XPEventType,
  customAmount?: number
): Promise<{ newXP: number; newLevel: number; leveledUp: boolean }> {
  const amount = customAmount ?? XP_AMOUNTS[eventType];
  const current = await getGamificationData(userId);

  const newXP = current.xp + amount;
  const newLevel = getLevelFromXP(newXP);
  const leveledUp = newLevel > current.level;

  await saveGamificationData({
    ...current,
    xp: newXP,
    level: newLevel,
  });

  return { newXP, newLevel, leveledUp };
}

/**
 * Record a study activity and update streak
 */
export async function recordStudyActivity(userId: string): Promise<{
  currentStreak: number;
  streakIncreased: boolean;
  streakBroken: boolean;
}> {
  const current = await getGamificationData(userId);
  const now = Date.now();

  let newStreak = current.currentStreak;
  let streakIncreased = false;
  let streakBroken = false;

  if (current.lastStudyDate) {
    const lastDate = new Date(current.lastStudyDate);
    const today = new Date(now);

    // Reset to start of day for comparison
    lastDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      // Same day, no change
    } else if (diffDays === 1) {
      // Consecutive day
      newStreak = current.currentStreak + 1;
      streakIncreased = true;
    } else {
      // Streak broken
      newStreak = 1;
      streakBroken = current.currentStreak > 0;
    }
  } else {
    // First activity
    newStreak = 1;
    streakIncreased = true;
  }

  const newLongestStreak = Math.max(current.longestStreak, newStreak);

  await saveGamificationData({
    ...current,
    currentStreak: newStreak,
    longestStreak: newLongestStreak,
    lastStudyDate: now,
  });

  // Award streak bonus if streak increased
  if (streakIncreased && newStreak > 1) {
    const streakBonus = Math.min(newStreak, 7) * XP_AMOUNTS["streak-bonus"];
    await awardXP(userId, "streak-bonus", streakBonus);
  }

  return { currentStreak: newStreak, streakIncreased, streakBroken };
}

/**
 * Check and unlock an achievement
 */
export async function checkAndUnlockAchievement(
  userId: string,
  achievementId: AchievementId
): Promise<{ unlocked: boolean; xpAwarded: number }> {
  const current = await getGamificationData(userId);

  // Already unlocked
  if (current.achievements.includes(achievementId)) {
    return { unlocked: false, xpAwarded: 0 };
  }

  const achievement = getAchievementById(achievementId);
  if (!achievement) {
    return { unlocked: false, xpAwarded: 0 };
  }

  // Unlock in database
  const unlocked = await unlockAchievementRepo(userId, achievementId);

  if (unlocked) {
    // Award XP for achievement
    await awardXP(userId, "achievement-unlocked", achievement.xpReward);

    // Invalidate cache
    invalidate([CACHE_KEYS.userData(userId)]);

    return { unlocked: true, xpAwarded: achievement.xpReward };
  }

  return { unlocked: false, xpAwarded: 0 };
}

/**
 * Record completing a study session
 */
export async function recordStudySessionComplete(
  userId: string,
  options: {
    cardsStudied?: number;
    cardsMastered?: number;
    questionsAnswered?: number;
    questionsCorrect?: number;
    isPerfectScore?: boolean;
    durationSeconds?: number;
    isFullTest?: boolean;
  } = {}
): Promise<void> {
  const current = await getGamificationData(userId);

  // Update stats
  const updatedData = {
    ...current,
    totalCardsStudied: current.totalCardsStudied + (options.cardsStudied ?? 0),
    totalQuestionsAnswered:
      current.totalQuestionsAnswered + (options.questionsAnswered ?? 0),
    perfectScores: current.perfectScores + (options.isPerfectScore ? 1 : 0),
    totalStudySessions: current.totalStudySessions + 1,
  };

  await saveGamificationData(updatedData);

  // Record study activity for streak
  await recordStudyActivity(userId);

  // Award XP for various actions
  if (options.cardsStudied) {
    await awardXP(
      userId,
      "card-studied",
      options.cardsStudied * XP_AMOUNTS["card-studied"]
    );
  }

  if (options.cardsMastered) {
    await awardXP(
      userId,
      "card-mastered",
      options.cardsMastered * XP_AMOUNTS["card-mastered"]
    );
  }

  if (options.questionsAnswered) {
    await awardXP(
      userId,
      "question-answered",
      options.questionsAnswered * XP_AMOUNTS["question-answered"]
    );
  }

  if (options.questionsCorrect) {
    await awardXP(
      userId,
      "question-correct",
      options.questionsCorrect * XP_AMOUNTS["question-correct"]
    );
  }

  if (options.isPerfectScore) {
    await awardXP(userId, "perfect-score");
    await checkAndUnlockAchievement(userId, "perfectionist");
  }

  await awardXP(userId, "study-session-complete");

  // Check achievements
  const updated = await getGamificationData(userId);

  // First steps
  if (updated.totalStudySessions === 1) {
    await checkAndUnlockAchievement(userId, "first-steps");
  }

  // Card shark (100 cards mastered)
  if (updated.totalCardsStudied >= 100) {
    await checkAndUnlockAchievement(userId, "card-shark");
  }

  // Speed demon (under 5 minutes)
  if (options.durationSeconds && options.durationSeconds < 300) {
    await checkAndUnlockAchievement(userId, "speed-demon");
  }

  // SAT ready (full test)
  if (options.isFullTest) {
    await checkAndUnlockAchievement(userId, "sat-ready");
  }

  // Time-based achievements
  const hour = new Date().getHours();
  if (hour >= 22 || hour < 4) {
    await checkAndUnlockAchievement(userId, "night-owl");
  }
  if (hour >= 4 && hour < 7) {
    await checkAndUnlockAchievement(userId, "early-bird");
  }

  // Streak achievements
  if (updated.currentStreak >= 7) {
    await checkAndUnlockAchievement(userId, "on-fire");
  }
  if (updated.currentStreak >= 30) {
    await checkAndUnlockAchievement(userId, "dedicated");
  }
}

/**
 * Record sharing a flashcard set
 */
export async function recordFlashcardSetShared(userId: string): Promise<void> {
  await checkAndUnlockAchievement(userId, "social-butterfly");
}

/**
 * Get leaderboard position for a user (simplified version)
 */
export async function getLeaderboardPosition(
  _userId: string
): Promise<{ rank: number; totalUsers: number } | null> {
  // This would need a more complex implementation with Firestore aggregation
  // For MVP, we can return null and implement later
  return null;
}
