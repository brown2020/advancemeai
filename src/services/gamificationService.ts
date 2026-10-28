/**
 * Gamification Service
 * Reads progress from Firestore and records awards through the server.
 * Clients cannot write XP documents directly.
 */

import { getGamificationData as getGamificationRepo } from "@/api/firebase/gamificationRepository";
import type { AchievementId, GamificationData } from "@/types/gamification";
import { createDefaultGamificationData, getAchievementById } from "@/types/gamification";
import { createCachedService } from "@/utils/cachedService";

const CACHE_KEYS = {
  userData: (userId: string) => `gamification:${userId}`,
};

const { cachedFetch, invalidate } = createCachedService<GamificationData>("gamification");

type AwardResponse = {
  xp: number;
  level: number;
  currentStreak: number;
  achievements: AchievementId[];
};

async function postAward(body: Record<string, unknown>): Promise<AwardResponse> {
  const response = await fetch("/api/gamification/award", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error("Failed to save progress");
  }
  return response.json() as Promise<AwardResponse>;
}

/**
 * Get user's gamification data. Missing documents stay local defaults
 * until the first server-side award creates them.
 */
export async function getGamificationData(userId: string): Promise<GamificationData> {
  return cachedFetch({
    cacheKey: CACHE_KEYS.userData(userId),
    fetchData: async () => {
      const result = await getGamificationRepo(userId);
      if (result) return result;
      const now = Date.now();
      return { ...createDefaultGamificationData(userId), createdAt: now, updatedAt: now };
    },
    logMessage: `Fetching gamification data for user: ${userId}`,
  });
}

export async function refreshGamificationData(userId: string): Promise<GamificationData> {
  invalidate([CACHE_KEYS.userData(userId)]);
  return getGamificationData(userId);
}

/**
 * Record a study activity and update streak on the server.
 */
export async function recordStudyActivity(userId: string): Promise<{
  currentStreak: number;
  streakIncreased: boolean;
  streakBroken: boolean;
}> {
  const before = await getGamificationRepo(userId);
  const previous = before?.currentStreak ?? 0;
  const result = await postAward({ kind: "activity" });
  invalidate([CACHE_KEYS.userData(userId)]);
  return {
    currentStreak: result.currentStreak,
    streakIncreased: result.currentStreak > previous,
    streakBroken: result.currentStreak < previous,
  };
}

/**
 * Ask the server to unlock an achievement when its criteria are already met.
 */
export async function checkAndUnlockAchievement(
  userId: string,
  achievementId: AchievementId
): Promise<{ unlocked: boolean; xpAwarded: number }> {
  const achievement = getAchievementById(achievementId);
  if (!achievement) return { unlocked: false, xpAwarded: 0 };

  const before = await getGamificationRepo(userId);
  if (before?.achievements.includes(achievementId)) {
    return { unlocked: false, xpAwarded: 0 };
  }

  const result = await postAward({ kind: "achievement", achievementId });
  invalidate([CACHE_KEYS.userData(userId)]);
  const unlocked = result.achievements.includes(achievementId);
  return { unlocked, xpAwarded: unlocked ? achievement.xpReward : 0 };
}

/**
 * Record completing a study session. The server caps counts and awards XP.
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
  await postAward({
    kind: "session",
    cardsStudied: options.cardsStudied ?? 0,
    cardsMastered: options.cardsMastered ?? 0,
    questionsAnswered: options.questionsAnswered ?? 0,
    questionsCorrect: options.questionsCorrect ?? 0,
    isPerfectScore: options.isPerfectScore ?? false,
    durationSeconds: options.durationSeconds ?? 0,
    isFullTest: options.isFullTest ?? false,
  });
  invalidate([CACHE_KEYS.userData(userId)]);
}
