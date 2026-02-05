"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import type {
  AchievementId,
  GamificationData,
  XPEventType,
} from "@/types/gamification";
import {
  XP_AMOUNTS,
  getLevelFromXP,
  getAchievementById,
  createDefaultGamificationData,
} from "@/types/gamification";

type UserId = string;

/**
 * Check if two dates are on the same day
 */
function isSameDay(date1: number, date2: number): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Check if date1 is exactly one day before date2
 */
function isConsecutiveDay(date1: number, date2: number): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  // Set both to start of day
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);

  const diffMs = d2.getTime() - d1.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  return diffDays === 1;
}

/**
 * Get the current hour (0-23)
 */
function getCurrentHour(): number {
  return new Date().getHours();
}

interface GamificationState {
  // Data per user
  dataByUserId: Record<UserId, GamificationData>;

  // Pending achievements to show as toasts
  pendingAchievements: AchievementId[];

  // Actions
  getData: (userId: UserId) => GamificationData;
  hydrateFromServer: (userId: UserId, data: Partial<GamificationData>) => void;

  // XP and progression
  addXP: (userId: UserId, eventType: XPEventType, customAmount?: number) => number;

  // Streak management
  recordStudyActivity: (userId: UserId) => void;

  // Achievement tracking
  checkAndUnlockAchievement: (userId: UserId, achievementId: AchievementId) => boolean;
  clearPendingAchievements: () => void;

  // Stats tracking
  incrementCardsStudied: (userId: UserId, count?: number) => void;
  incrementCardsMastered: (userId: UserId, count?: number) => void;
  incrementQuestionsAnswered: (userId: UserId, count?: number) => void;
  recordPerfectScore: (userId: UserId) => void;
  incrementStudySessions: (userId: UserId) => void;

  // Reset
  resetUserData: (userId: UserId) => void;
}

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      dataByUserId: {},
      pendingAchievements: [],

      getData: (userId) => {
        const existing = get().dataByUserId[userId];
        if (existing) return existing;

        // Return default data structure
        const now = Date.now();
        return {
          ...createDefaultGamificationData(userId),
          createdAt: now,
          updatedAt: now,
        };
      },

      hydrateFromServer: (userId, serverData) => {
        const current = get().getData(userId);
        const merged: GamificationData = {
          ...current,
          ...serverData,
          // Keep the higher values for stats
          xp: Math.max(current.xp, serverData.xp ?? 0),
          currentStreak: Math.max(current.currentStreak, serverData.currentStreak ?? 0),
          longestStreak: Math.max(current.longestStreak, serverData.longestStreak ?? 0),
          totalCardsStudied: Math.max(current.totalCardsStudied, serverData.totalCardsStudied ?? 0),
          totalCardsMastered: Math.max(current.totalCardsMastered ?? 0, serverData.totalCardsMastered ?? 0),
          totalQuestionsAnswered: Math.max(current.totalQuestionsAnswered, serverData.totalQuestionsAnswered ?? 0),
          perfectScores: Math.max(current.perfectScores, serverData.perfectScores ?? 0),
          totalStudySessions: Math.max(current.totalStudySessions, serverData.totalStudySessions ?? 0),
          // Merge achievements
          achievements: Array.from(
            new Set([...current.achievements, ...(serverData.achievements ?? [])])
          ) as AchievementId[],
          achievementDates: {
            ...current.achievementDates,
            ...serverData.achievementDates,
          },
          updatedAt: Date.now(),
        };

        // Recalculate level from XP
        merged.level = getLevelFromXP(merged.xp);

        set({
          dataByUserId: {
            ...get().dataByUserId,
            [userId]: merged,
          },
        });
      },

      addXP: (userId, eventType, customAmount) => {
        const amount = customAmount ?? XP_AMOUNTS[eventType];
        const current = get().getData(userId);

        const newXP = current.xp + amount;
        const newLevel = getLevelFromXP(newXP);

        set({
          dataByUserId: {
            ...get().dataByUserId,
            [userId]: {
              ...current,
              xp: newXP,
              level: newLevel,
              updatedAt: Date.now(),
            },
          },
        });

        return amount;
      },

      recordStudyActivity: (userId) => {
        const current = get().getData(userId);
        const now = Date.now();
        const hour = getCurrentHour();

        let newStreak = current.currentStreak;

        // Check streak logic
        if (current.lastStudyDate) {
          if (isSameDay(current.lastStudyDate, now)) {
            // Same day, no streak change
          } else if (isConsecutiveDay(current.lastStudyDate, now)) {
            // Consecutive day, increment streak
            newStreak = current.currentStreak + 1;

            // Award streak bonus XP
            get().addXP(userId, "streak-bonus", XP_AMOUNTS["streak-bonus"] * Math.min(newStreak, 7));
          } else {
            // Streak broken, reset to 1
            newStreak = 1;
          }
        } else {
          // First study activity
          newStreak = 1;
        }

        const newLongestStreak = Math.max(current.longestStreak, newStreak);

        set({
          dataByUserId: {
            ...get().dataByUserId,
            [userId]: {
              ...current,
              currentStreak: newStreak,
              longestStreak: newLongestStreak,
              lastStudyDate: now,
              updatedAt: now,
            },
          },
        });

        // Check time-based achievements
        if (hour >= 22 || hour < 4) {
          get().checkAndUnlockAchievement(userId, "night-owl");
        }
        if (hour >= 4 && hour < 7) {
          get().checkAndUnlockAchievement(userId, "early-bird");
        }

        // Check streak achievements
        if (newStreak >= 7) {
          get().checkAndUnlockAchievement(userId, "on-fire");
        }
        if (newStreak >= 30) {
          get().checkAndUnlockAchievement(userId, "dedicated");
        }
      },

      checkAndUnlockAchievement: (userId, achievementId) => {
        const current = get().getData(userId);

        // Already unlocked
        if (current.achievements.includes(achievementId)) {
          return false;
        }

        const achievement = getAchievementById(achievementId);
        if (!achievement) return false;

        const now = Date.now();

        // Add achievement
        const newAchievements = [...current.achievements, achievementId];
        const newAchievementDates = {
          ...current.achievementDates,
          [achievementId]: now,
        };

        // Add XP reward
        const newXP = current.xp + achievement.xpReward;
        const newLevel = getLevelFromXP(newXP);

        set({
          dataByUserId: {
            ...get().dataByUserId,
            [userId]: {
              ...current,
              achievements: newAchievements as AchievementId[],
              achievementDates: newAchievementDates,
              xp: newXP,
              level: newLevel,
              updatedAt: now,
            },
          },
          pendingAchievements: [...get().pendingAchievements, achievementId],
        });

        return true;
      },

      clearPendingAchievements: () => {
        set({ pendingAchievements: [] });
      },

      incrementCardsStudied: (userId, count = 1) => {
        const current = get().getData(userId);
        set({
          dataByUserId: {
            ...get().dataByUserId,
            [userId]: {
              ...current,
              totalCardsStudied: current.totalCardsStudied + count,
              updatedAt: Date.now(),
            },
          },
        });
      },

      incrementCardsMastered: (userId, count = 1) => {
        const current = get().getData(userId);
        const newTotal = (current.totalCardsMastered ?? 0) + count;

        set({
          dataByUserId: {
            ...get().dataByUserId,
            [userId]: {
              ...current,
              totalCardsMastered: newTotal,
              updatedAt: Date.now(),
            },
          },
        });

        // Check card shark achievement
        if (newTotal >= 100) {
          get().checkAndUnlockAchievement(userId, "card-shark");
        }
      },

      incrementQuestionsAnswered: (userId, count = 1) => {
        const current = get().getData(userId);
        set({
          dataByUserId: {
            ...get().dataByUserId,
            [userId]: {
              ...current,
              totalQuestionsAnswered: current.totalQuestionsAnswered + count,
              updatedAt: Date.now(),
            },
          },
        });
      },

      recordPerfectScore: (userId) => {
        const current = get().getData(userId);
        set({
          dataByUserId: {
            ...get().dataByUserId,
            [userId]: {
              ...current,
              perfectScores: current.perfectScores + 1,
              updatedAt: Date.now(),
            },
          },
        });

        // Unlock perfectionist achievement
        get().checkAndUnlockAchievement(userId, "perfectionist");
      },

      incrementStudySessions: (userId) => {
        const current = get().getData(userId);
        const newTotal = current.totalStudySessions + 1;

        set({
          dataByUserId: {
            ...get().dataByUserId,
            [userId]: {
              ...current,
              totalStudySessions: newTotal,
              updatedAt: Date.now(),
            },
          },
        });

        // Check first steps achievement
        if (newTotal === 1) {
          get().checkAndUnlockAchievement(userId, "first-steps");
        }
      },

      resetUserData: (userId) => {
        const data = get().dataByUserId;
        const { [userId]: _, ...rest } = data;
        set({ dataByUserId: rest });
      },
    }),
    {
      name: "gamification-v1",
      partialize: (state) => ({
        dataByUserId: state.dataByUserId,
      }),
    }
  )
);

// ── Granular Selectors ──────────────────────────────────────────────────
// Use these instead of subscribing to the entire store to avoid unnecessary re-renders.

/** Select only XP and level for a given user */
export function useGamificationXP(userId: string) {
  return useGamificationStore(
    useShallow((s) => {
      const data = s.dataByUserId[userId];
      return { xp: data?.xp ?? 0, level: data?.level ?? 1 };
    })
  );
}

/** Select only streak data for a given user */
export function useGamificationStreak(userId: string) {
  return useGamificationStore(
    useShallow((s) => {
      const data = s.dataByUserId[userId];
      return {
        currentStreak: data?.currentStreak ?? 0,
        longestStreak: data?.longestStreak ?? 0,
      };
    })
  );
}

/** Select only achievements for a given user */
export function useGamificationAchievements(userId: string) {
  return useGamificationStore(
    useShallow((s) => {
      const data = s.dataByUserId[userId];
      return {
        achievements: data?.achievements ?? [],
        achievementDates: data?.achievementDates ?? {},
      };
    })
  );
}

/** Select pending achievements for toast display */
export function useGamificationPending() {
  return useGamificationStore((s) => s.pendingAchievements);
}
