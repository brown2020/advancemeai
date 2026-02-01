/**
 * Gamification type definitions
 * XP, streaks, achievements, and levels
 */

import type { Timestamp, UserId } from "./common";

// Achievement IDs
export type AchievementId =
  | "first-steps"
  | "on-fire"
  | "perfectionist"
  | "card-shark"
  | "speed-demon"
  | "night-owl"
  | "early-bird"
  | "dedicated"
  | "sat-ready"
  | "social-butterfly";

/**
 * Achievement definition
 */
export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  xpReward: number;
}

/**
 * User's gamification data stored in Firestore
 */
export interface GamificationData {
  userId: UserId;
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastStudyDate: Timestamp | null;
  achievements: AchievementId[];
  achievementDates: Record<AchievementId, Timestamp>;
  totalCardsStudied: number;
  totalQuestionsAnswered: number;
  perfectScores: number;
  totalStudySessions: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * XP earning event types
 */
export type XPEventType =
  | "card-studied"
  | "card-mastered"
  | "question-answered"
  | "question-correct"
  | "perfect-score"
  | "study-session-complete"
  | "match-game-complete"
  | "streak-bonus"
  | "achievement-unlocked";

/**
 * XP earning event
 */
export interface XPEvent {
  type: XPEventType;
  amount: number;
  timestamp: Timestamp;
  metadata?: Record<string, unknown>;
}

/**
 * XP amounts for different actions
 */
export const XP_AMOUNTS: Record<XPEventType, number> = {
  "card-studied": 5,
  "card-mastered": 25,
  "question-answered": 10,
  "question-correct": 15,
  "perfect-score": 50,
  "study-session-complete": 30,
  "match-game-complete": 40,
  "streak-bonus": 20, // Per day of streak
  "achievement-unlocked": 0, // Varies by achievement
};

/**
 * Level thresholds (XP required for each level)
 * Level 1 = 0 XP, Level 2 = 100 XP, etc.
 * Scales progressively
 */
export function getXPForLevel(level: number): number {
  if (level <= 1) return 0;
  // Formula: 100 * (level - 1) * (1 + (level - 1) * 0.1)
  // Level 2 = 100, Level 3 = 220, Level 10 = 1710, etc.
  return Math.floor(100 * (level - 1) * (1 + (level - 1) * 0.1));
}

/**
 * Calculate level from total XP
 */
export function getLevelFromXP(xp: number): number {
  let level = 1;
  while (getXPForLevel(level + 1) <= xp && level < 50) {
    level++;
  }
  return level;
}

/**
 * Get XP progress within current level (0-100%)
 */
export function getLevelProgress(xp: number): number {
  const currentLevel = getLevelFromXP(xp);
  const currentLevelXP = getXPForLevel(currentLevel);
  const nextLevelXP = getXPForLevel(currentLevel + 1);

  if (currentLevel >= 50) return 100;

  const progressXP = xp - currentLevelXP;
  const requiredXP = nextLevelXP - currentLevelXP;

  return Math.min(100, Math.floor((progressXP / requiredXP) * 100));
}

/**
 * Achievement definitions
 */
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-steps",
    name: "First Steps",
    description: "Complete your first study session",
    icon: "Footprints",
    xpReward: 50,
  },
  {
    id: "on-fire",
    name: "On Fire",
    description: "Maintain a 7-day study streak",
    icon: "Flame",
    xpReward: 100,
  },
  {
    id: "perfectionist",
    name: "Perfectionist",
    description: "Get 100% on any test or quiz",
    icon: "Trophy",
    xpReward: 75,
  },
  {
    id: "card-shark",
    name: "Card Shark",
    description: "Master 100 flashcards",
    icon: "Layers",
    xpReward: 150,
  },
  {
    id: "speed-demon",
    name: "Speed Demon",
    description: "Complete a practice section in under 5 minutes",
    icon: "Zap",
    xpReward: 60,
  },
  {
    id: "night-owl",
    name: "Night Owl",
    description: "Study after 10 PM",
    icon: "Moon",
    xpReward: 25,
  },
  {
    id: "early-bird",
    name: "Early Bird",
    description: "Study before 7 AM",
    icon: "Sun",
    xpReward: 25,
  },
  {
    id: "dedicated",
    name: "Dedicated",
    description: "Maintain a 30-day study streak",
    icon: "Award",
    xpReward: 300,
  },
  {
    id: "sat-ready",
    name: "SAT Ready",
    description: "Complete a full-length practice test",
    icon: "GraduationCap",
    xpReward: 200,
  },
  {
    id: "social-butterfly",
    name: "Social Butterfly",
    description: "Share a flashcard set with others",
    icon: "Share2",
    xpReward: 50,
  },
];

/**
 * Get achievement by ID
 */
export function getAchievementById(id: AchievementId): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

/**
 * Default gamification data for new users
 */
export function createDefaultGamificationData(userId: UserId): Omit<GamificationData, "createdAt" | "updatedAt"> {
  return {
    userId,
    xp: 0,
    level: 1,
    currentStreak: 0,
    longestStreak: 0,
    lastStudyDate: null,
    achievements: [],
    achievementDates: {} as Record<AchievementId, Timestamp>,
    totalCardsStudied: 0,
    totalQuestionsAnswered: 0,
    perfectScores: 0,
    totalStudySessions: 0,
  };
}
