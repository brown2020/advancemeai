import { SECTION_TITLES } from "@/constants/appConstants";
import type { FlashcardSet } from "@/types/flashcard";
import type { PracticeAttemptRecord } from "@/api/firebase/practiceProgressRepository";
import type { FlashcardStudySessionLog } from "@/types/flashcard-study-progress";

/** Estimated minutes credited per flashcard set studied on a given day */
export const FLASHCARD_SESSION_MINUTES = 5;

export type MasteryBreakdown = {
  notStarted: number;
  learning: number;
  familiar: number;
  mastered: number;
};

export type TopicPerformance = {
  topic: string;
  correct: number;
  total: number;
};

export type ProgressAnalyticsData = {
  studyData: Record<string, number>;
  weeklyMinutes: number[];
  masteryData: MasteryBreakdown;
  topicData: TopicPerformance[];
  hasActivity: boolean;
};

type FlashcardProgressRow = {
  setId: string;
  masteryByCardId: Record<string, 0 | 1 | 2 | 3>;
  updatedAt?: number;
  recentSessions?: FlashcardStudySessionLog[];
};

function sessionMinutes(durationSeconds: number): number {
  return Math.max(1, Math.round(durationSeconds / 60));
}

/**
 * Adds flashcard study time to daily aggregates (recorded sessions or legacy estimate).
 */
export function accumulateFlashcardStudyMetrics(
  progressList: FlashcardProgressRow[],
  dailyActivityCounts: Record<string, number>,
  dailyMinutes: Record<string, number>
): void {
  for (const row of progressList) {
    const sessions = row.recentSessions ?? [];

    if (sessions.length > 0) {
      for (const session of sessions) {
        const date = dateKeyFromTimestamp(session.completedAt);
        dailyActivityCounts[date] = (dailyActivityCounts[date] ?? 0) + 1;
        dailyMinutes[date] =
          (dailyMinutes[date] ?? 0) + sessionMinutes(session.durationSeconds);
      }
      continue;
    }

    if (!row.updatedAt) continue;
    const date = dateKeyFromTimestamp(row.updatedAt);
    const hasStudy = Object.values(row.masteryByCardId).some((m) => m > 0);
    if (!hasStudy) continue;
    dailyActivityCounts[date] = (dailyActivityCounts[date] ?? 0) + 1;
    dailyMinutes[date] =
      (dailyMinutes[date] ?? 0) + FLASHCARD_SESSION_MINUTES;
  }
}

function dateKeyFromTimestamp(ms: number): string {
  return new Date(ms).toISOString().split("T")[0]!;
}

function intensityFromCount(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

/**
 * Maps daily activity counts to calendar heatmap levels (0–4).
 */
export function buildStudyCalendar(
  dailyActivityCounts: Record<string, number>
): Record<string, number> {
  const studyData: Record<string, number> = {};
  for (const [date, count] of Object.entries(dailyActivityCounts)) {
    studyData[date] = intensityFromCount(count);
  }
  return studyData;
}

/**
 * Sums study minutes per day-of-week (Sun–Sat) for the last 7 calendar days.
 */
export function buildWeeklyMinutes(
  dailyMinutes: Record<string, number>,
  referenceDate: Date = new Date()
): number[] {
  const weekly = [0, 0, 0, 0, 0, 0, 0];

  for (let offset = 0; offset < 7; offset++) {
    const date = new Date(referenceDate);
    date.setDate(referenceDate.getDate() - offset);
    const key = dateKeyFromTimestamp(date.getTime());
    const dayIndex = date.getDay();
    weekly[dayIndex] = (weekly[dayIndex] ?? 0) + (dailyMinutes[key] ?? 0);
  }

  return weekly;
}

/**
 * Buckets flashcard mastery levels across the user's sets.
 */
export function buildMasteryBreakdown(
  sets: FlashcardSet[],
  progressList: FlashcardProgressRow[]
): MasteryBreakdown {
  const progressBySet = new Map(
    progressList.map((row) => [row.setId, row.masteryByCardId])
  );

  const breakdown: MasteryBreakdown = {
    notStarted: 0,
    learning: 0,
    familiar: 0,
    mastered: 0,
  };

  for (const set of sets) {
    const mastery = progressBySet.get(set.id) ?? {};
    for (const card of set.cards) {
      const level = mastery[card.id] ?? 0;
      switch (level) {
        case 3:
          breakdown.mastered += 1;
          break;
        case 2:
          breakdown.familiar += 1;
          break;
        case 1:
          breakdown.learning += 1;
          break;
        default:
          breakdown.notStarted += 1;
      }
    }
  }

  return breakdown;
}

/**
 * Aggregates SAT practice attempts by section for topic breakdown UI.
 */
export function buildTopicPerformance(
  attempts: PracticeAttemptRecord[]
): TopicPerformance[] {
  const bySection = new Map<string, { correct: number; total: number }>();

  for (const attempt of attempts) {
    const sectionId = attempt.sectionId || "unknown";
    const current = bySection.get(sectionId) ?? { correct: 0, total: 0 };
    current.total += 1;
    if (attempt.isCorrect) current.correct += 1;
    bySection.set(sectionId, current);
  }

  return Array.from(bySection.entries())
    .map(([sectionId, stats]) => ({
      topic: SECTION_TITLES[sectionId] ?? sectionId,
      correct: stats.correct,
      total: stats.total,
    }))
    .filter((row) => row.total > 0)
    .sort((a, b) => a.topic.localeCompare(b.topic));
}

/**
 * Builds full progress dashboard analytics from Firestore-backed inputs.
 */
export function buildProgressAnalytics(
  attempts: PracticeAttemptRecord[],
  progressList: FlashcardProgressRow[],
  sets: FlashcardSet[],
  referenceDate: Date = new Date()
): ProgressAnalyticsData {
  const dailyActivityCounts: Record<string, number> = {};
  const dailyMinutes: Record<string, number> = {};

  for (const attempt of attempts) {
    if (!attempt.createdAt) continue;
    const date = dateKeyFromTimestamp(attempt.createdAt);
    dailyActivityCounts[date] = (dailyActivityCounts[date] ?? 0) + 1;
    const minutes = Math.max(1, Math.round(attempt.timeSpentMs / 60_000));
    dailyMinutes[date] = (dailyMinutes[date] ?? 0) + minutes;
  }

  accumulateFlashcardStudyMetrics(
    progressList,
    dailyActivityCounts,
    dailyMinutes
  );

  const studyData = buildStudyCalendar(dailyActivityCounts);
  const weeklyMinutes = buildWeeklyMinutes(dailyMinutes, referenceDate);
  const masteryData = buildMasteryBreakdown(sets, progressList);
  const topicData = buildTopicPerformance(attempts);

  const hasActivity =
    attempts.length > 0 ||
    progressList.some((row) =>
      Object.values(row.masteryByCardId).some((m) => m > 0)
    );

  return {
    studyData,
    weeklyMinutes,
    masteryData,
    topicData,
    hasActivity,
  };
}
