"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useGamificationStore } from "@/stores/gamification-store";
import type { XPEventType, AchievementId } from "@/types/gamification";
import * as gamificationService from "@/services/gamificationService";

/**
 * Hook for accessing and updating gamification state
 * Handles syncing between local store and server
 */
export function useGamification() {
  const { user } = useAuth();
  const userId = user?.uid ?? "anonymous";
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const store = useGamificationStore();
  const storeRef = useRef(store);
  storeRef.current = store;

  const data = store.getData(userId);

  // Sync from server on mount when authenticated
  useEffect(() => {
    const uid = user?.uid;
    if (!uid) return;

    let cancelled = false;

    const syncFromServer = async (userId: string) => {
      try {
        const serverData = await gamificationService.getGamificationData(userId);
        if (!cancelled && serverData) {
          storeRef.current.hydrateFromServer(userId, serverData);
        }
      } catch (error) {
        console.error("Failed to sync gamification data:", error);
      }
    };

    void syncFromServer(uid);

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  /**
   * Award XP for an action (local only, use recordActivity for full tracking)
   */
  const awardXP = useCallback(
    (eventType: XPEventType, customAmount?: number) => {
      return storeRef.current.addXP(userIdRef.current, eventType, customAmount);
    },
    []
  );

  /**
   * Record a study activity - updates streak and syncs to server
   */
  const recordActivity = useCallback(async () => {
    const currentUserId = userIdRef.current;
    storeRef.current.recordStudyActivity(currentUserId);

    // Sync to server in background if authenticated
    if (currentUserId !== "anonymous") {
      try {
        await gamificationService.recordStudyActivity(currentUserId);
      } catch (error) {
        console.error("Failed to sync activity to server:", error);
      }
    }
  }, []);

  /**
   * Record completing a study session with stats
   */
  const recordSessionComplete = useCallback(
    async (options: {
      cardsStudied?: number;
      cardsMastered?: number;
      questionsAnswered?: number;
      questionsCorrect?: number;
      isPerfectScore?: boolean;
      durationSeconds?: number;
      isFullTest?: boolean;
    }) => {
      const currentUserId = userIdRef.current;
      const currentStore = storeRef.current;

      // Update local store
      currentStore.recordStudyActivity(currentUserId);
      currentStore.incrementStudySessions(currentUserId);

      if (options.cardsStudied) {
        currentStore.incrementCardsStudied(currentUserId, options.cardsStudied);
        currentStore.addXP(currentUserId, "card-studied", options.cardsStudied * 5);
      }

      if (options.cardsMastered) {
        currentStore.incrementCardsMastered(currentUserId, options.cardsMastered);
        currentStore.addXP(currentUserId, "card-mastered", options.cardsMastered * 25);
      }

      if (options.questionsAnswered) {
        currentStore.incrementQuestionsAnswered(currentUserId, options.questionsAnswered);
        currentStore.addXP(currentUserId, "question-answered", options.questionsAnswered * 10);
      }

      if (options.questionsCorrect) {
        currentStore.addXP(currentUserId, "question-correct", options.questionsCorrect * 15);
      }

      if (options.isPerfectScore) {
        currentStore.recordPerfectScore(currentUserId);
        currentStore.addXP(currentUserId, "perfect-score");
      }

      currentStore.addXP(currentUserId, "study-session-complete");

      // Check achievements locally
      const updated = currentStore.getData(currentUserId);

      if (updated.totalStudySessions === 1) {
        currentStore.checkAndUnlockAchievement(currentUserId, "first-steps");
      }

      if (updated.totalCardsStudied >= 100) {
        currentStore.checkAndUnlockAchievement(currentUserId, "card-shark");
      }

      if (options.durationSeconds && options.durationSeconds < 300) {
        currentStore.checkAndUnlockAchievement(currentUserId, "speed-demon");
      }

      if (options.isFullTest) {
        currentStore.checkAndUnlockAchievement(currentUserId, "sat-ready");
      }

      // Sync to server if authenticated
      if (currentUserId !== "anonymous") {
        try {
          await gamificationService.recordStudySessionComplete(currentUserId, options);
        } catch (error) {
          console.error("Failed to sync session to server:", error);
        }
      }
    },
    []
  );

  /**
   * Check and unlock an achievement
   */
  const unlockAchievement = useCallback(
    async (achievementId: AchievementId) => {
      const currentUserId = userIdRef.current;
      const unlocked = storeRef.current.checkAndUnlockAchievement(currentUserId, achievementId);

      if (unlocked && currentUserId !== "anonymous") {
        try {
          await gamificationService.checkAndUnlockAchievement(currentUserId, achievementId);
        } catch (error) {
          console.error("Failed to sync achievement to server:", error);
        }
      }

      return unlocked;
    },
    []
  );

  /**
   * Save current state to server
   */
  const syncToServer = useCallback(async () => {
    const currentUserId = userIdRef.current;
    if (currentUserId === "anonymous") return;

    const currentData = storeRef.current.getData(currentUserId);
    try {
      await gamificationService.saveGamificationData(currentData);
    } catch (error) {
      console.error("Failed to save gamification data:", error);
    }
  }, []);

  return {
    // Data
    xp: data.xp,
    level: data.level,
    currentStreak: data.currentStreak,
    longestStreak: data.longestStreak,
    achievements: data.achievements,
    achievementDates: data.achievementDates,
    totalCardsStudied: data.totalCardsStudied,
    totalQuestionsAnswered: data.totalQuestionsAnswered,
    perfectScores: data.perfectScores,
    totalStudySessions: data.totalStudySessions,

    // Computed
    isAuthenticated: !!user?.uid,

    // Actions
    awardXP,
    recordActivity,
    recordSessionComplete,
    unlockAchievement,
    syncToServer,
  };
}
