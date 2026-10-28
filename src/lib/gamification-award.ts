import type { AchievementId, GamificationData, XPEventType } from "@/types/gamification";
import {
  XP_AMOUNTS,
  createDefaultGamificationData,
  getAchievementById,
  getLevelFromXP,
} from "@/types/gamification";

export const GAMIFICATION_LIMITS = {
  cardsStudied: 200,
  cardsMastered: 200,
  questionsAnswered: 100,
  questionsCorrect: 100,
  durationSeconds: 6 * 60 * 60,
} as const;

export type SessionAwardInput = {
  kind: "session";
  cardsStudied: number;
  cardsMastered: number;
  questionsAnswered: number;
  questionsCorrect: number;
  isPerfectScore: boolean;
  durationSeconds: number;
  isFullTest: boolean;
  now?: number;
};

export type ActivityAwardInput = {
  kind: "activity";
  now?: number;
};

export type AchievementAwardInput = {
  kind: "achievement";
  achievementId: AchievementId;
  now?: number;
};

export type GamificationAwardInput =
  | SessionAwardInput
  | ActivityAwardInput
  | AchievementAwardInput;

function clamp(value: number, max: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(Math.floor(value), max);
}

function startOfDay(value: number): number {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function withXp(data: GamificationData, event: XPEventType, amount?: number): GamificationData {
  const gained = amount ?? XP_AMOUNTS[event];
  const xp = data.xp + Math.max(0, gained);
  return { ...data, xp, level: getLevelFromXP(xp) };
}

function unlockIf(
  data: GamificationData,
  achievementId: AchievementId,
  eligible: boolean,
  now: number
): GamificationData {
  if (!eligible || data.achievements.includes(achievementId)) return data;
  const achievement = getAchievementById(achievementId);
  if (!achievement) return data;
  const next = withXp(data, "achievement-unlocked", achievement.xpReward);
  return {
    ...next,
    achievements: [...next.achievements, achievementId],
    achievementDates: { ...next.achievementDates, [achievementId]: now },
  };
}

function applyStreak(data: GamificationData, now: number): GamificationData {
  let streak = data.currentStreak;
  let increased = false;

  if (data.lastStudyDate) {
    const diffDays = Math.floor(
      (startOfDay(now) - startOfDay(data.lastStudyDate)) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 0) {
      streak = data.currentStreak;
    } else if (diffDays === 1) {
      streak = data.currentStreak + 1;
      increased = true;
    } else if (diffDays > 1) {
      streak = 1;
    }
  } else {
    streak = 1;
    increased = true;
  }

  let next: GamificationData = {
    ...data,
    currentStreak: streak,
    longestStreak: Math.max(data.longestStreak, streak),
    lastStudyDate: now,
    updatedAt: now,
  };

  if (increased && streak > 1) {
    next = withXp(next, "streak-bonus", Math.min(streak, 7) * XP_AMOUNTS["streak-bonus"]);
  }

  return next;
}

function applyTimeAchievements(data: GamificationData, now: number): GamificationData {
  const hour = new Date(now).getHours();
  let next = unlockIf(data, "night-owl", hour >= 22 || hour < 4, now);
  next = unlockIf(next, "early-bird", hour >= 4 && hour < 7, now);
  next = unlockIf(next, "on-fire", next.currentStreak >= 7, now);
  next = unlockIf(next, "dedicated", next.currentStreak >= 30, now);
  return next;
}

function eligibleAchievement(
  data: GamificationData,
  achievementId: AchievementId,
  now: number
): boolean {
  const hour = new Date(now).getHours();
  switch (achievementId) {
    case "first-steps":
      return data.totalStudySessions >= 1;
    case "on-fire":
      return data.currentStreak >= 7;
    case "perfectionist":
      return data.perfectScores >= 1;
    case "card-shark":
      return data.totalCardsStudied >= 100;
    case "night-owl":
      return hour >= 22 || hour < 4;
    case "early-bird":
      return hour >= 4 && hour < 7;
    case "dedicated":
      return data.currentStreak >= 30;
    case "speed-demon":
    case "sat-ready":
    case "social-butterfly":
      return false;
    default:
      return false;
  }
}

export function applyGamificationAward(
  current: GamificationData | null,
  input: GamificationAwardInput,
  userId: string
): GamificationData {
  const now = input.now ?? Date.now();
  const base: GamificationData = current ?? {
    ...createDefaultGamificationData(userId),
    createdAt: now,
    updatedAt: now,
  };

  if (input.kind === "activity") {
    return applyTimeAchievements(applyStreak(base, now), now);
  }

  if (input.kind === "achievement") {
    return unlockIf(
      base,
      input.achievementId,
      eligibleAchievement(base, input.achievementId, now),
      now
    );
  }

  const cardsStudied = clamp(input.cardsStudied, GAMIFICATION_LIMITS.cardsStudied);
  const cardsMastered = clamp(input.cardsMastered, GAMIFICATION_LIMITS.cardsMastered);
  const questionsAnswered = clamp(
    input.questionsAnswered,
    GAMIFICATION_LIMITS.questionsAnswered
  );
  const questionsCorrect = clamp(
    input.questionsCorrect,
    Math.min(GAMIFICATION_LIMITS.questionsCorrect, questionsAnswered)
  );
  const durationSeconds = clamp(input.durationSeconds, GAMIFICATION_LIMITS.durationSeconds);

  let next: GamificationData = {
    ...base,
    totalCardsStudied: base.totalCardsStudied + cardsStudied,
    totalCardsMastered: (base.totalCardsMastered ?? 0) + cardsMastered,
    totalQuestionsAnswered: base.totalQuestionsAnswered + questionsAnswered,
    perfectScores: base.perfectScores + (input.isPerfectScore ? 1 : 0),
    totalStudySessions: base.totalStudySessions + 1,
    updatedAt: now,
  };

  if (cardsStudied) next = withXp(next, "card-studied", cardsStudied * XP_AMOUNTS["card-studied"]);
  if (cardsMastered) next = withXp(next, "card-mastered", cardsMastered * XP_AMOUNTS["card-mastered"]);
  if (questionsAnswered) {
    next = withXp(next, "question-answered", questionsAnswered * XP_AMOUNTS["question-answered"]);
  }
  if (questionsCorrect) {
    next = withXp(next, "question-correct", questionsCorrect * XP_AMOUNTS["question-correct"]);
  }
  if (input.isPerfectScore) next = withXp(next, "perfect-score");
  next = withXp(next, "study-session-complete");
  next = applyStreak(next, now);

  next = unlockIf(next, "first-steps", next.totalStudySessions >= 1, now);
  next = unlockIf(next, "card-shark", next.totalCardsStudied >= 100, now);
  next = unlockIf(next, "perfectionist", input.isPerfectScore, now);
  next = unlockIf(next, "speed-demon", durationSeconds > 0 && durationSeconds < 300, now);
  next = unlockIf(next, "sat-ready", input.isFullTest, now);
  next = applyTimeAchievements(next, now);
  return next;
}
