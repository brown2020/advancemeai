import type {
  ClassSetStatistics,
  SetProgress,
  StudentSummary,
} from "@/types/class-progress";
import {
  calculateMasteryPercentage,
  calculateOverallMastery,
  isSetCompleted,
} from "@/types/class-progress";
import type { FlashcardId } from "@/types/flashcard";
import type { UserId } from "@/types/common";

const ACTIVE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export type SharedSetInfo = {
  id: FlashcardId;
  title: string;
  totalCards: number;
};

export type MemberProgressEntry = {
  masteryByCardId: Record<string, 0 | 1 | 2 | 3>;
  updatedAt?: number;
};

export type MemberProfileInfo = {
  displayName: string;
  email?: string;
};

export type ClassProgressAggregate = {
  totalStudents: number;
  activeStudents: number;
  averageMastery: number;
  setStatistics: ClassSetStatistics[];
  studentSummaries: StudentSummary[];
};

function buildSetProgress(
  masteryByCardId: Record<string, 0 | 1 | 2 | 3>,
  totalCards: number
): SetProgress {
  const entries = Object.values(masteryByCardId);
  const cardsStudied = entries.filter((m) => m > 0).length;
  const cardsMastered = entries.filter((m) => m === 3).length;
  const masteryPercentage = calculateMasteryPercentage(
    cardsMastered,
    totalCards
  );

  return {
    setId: "",
    cardsStudied,
    cardsMastered,
    totalCards,
    masteryPercentage,
    timeSpentSeconds: 0,
    studySessions: cardsStudied > 0 ? 1 : 0,
  };
}

/**
 * Aggregates per-student flashcard study progress for shared class sets.
 */
export function aggregateClassProgress(
  sharedSets: SharedSetInfo[],
  studentIds: UserId[],
  progressByStudent: Record<UserId, Record<FlashcardId, MemberProgressEntry>>,
  profilesByStudent: Record<UserId, MemberProfileInfo>
): ClassProgressAggregate {
  const now = Date.now();
  const setStatistics: ClassSetStatistics[] = sharedSets.map((set) => {
    const startedMasteries: number[] = [];

    let studentsStarted = 0;
    let studentsCompleted = 0;

    for (const studentId of studentIds) {
      const entry = progressByStudent[studentId]?.[set.id];
      if (!entry) continue;

      const progress = buildSetProgress(entry.masteryByCardId, set.totalCards);
      if (progress.cardsStudied > 0) {
        studentsStarted += 1;
        startedMasteries.push(progress.masteryPercentage);
      }
      if (isSetCompleted(progress)) {
        studentsCompleted += 1;
      }
    }

    const averageMastery =
      startedMasteries.length > 0
        ? Math.round(
            startedMasteries.reduce((sum, v) => sum + v, 0) /
              startedMasteries.length
          )
        : 0;

    return {
      setId: set.id,
      setTitle: set.title,
      studentsStarted,
      studentsCompleted,
      totalStudents: studentIds.length,
      averageMastery,
      averageTimeSpent: 0,
    };
  });

  const studentSummaries: StudentSummary[] = studentIds.map((studentId) => {
    const setProgress: Record<FlashcardId, SetProgress> = {};
    let lastActiveAt: number | undefined;

    for (const set of sharedSets) {
      const entry = progressByStudent[studentId]?.[set.id];
      const progress = buildSetProgress(
        entry?.masteryByCardId ?? {},
        set.totalCards
      );
      progress.setId = set.id;
      setProgress[set.id] = progress;

      if (entry?.updatedAt) {
        lastActiveAt =
          lastActiveAt === undefined
            ? entry.updatedAt
            : Math.max(lastActiveAt, entry.updatedAt);
      }
    }

    const overallMastery = calculateOverallMastery(setProgress);
    const setsCompleted = Object.values(setProgress).filter(isSetCompleted)
      .length;

    const profile = profilesByStudent[studentId];

    return {
      userId: studentId,
      displayName: profile?.displayName ?? `Student ${studentId.slice(0, 6)}`,
      email: profile?.email,
      role: "student",
      overallMastery,
      setsCompleted,
      totalSets: sharedSets.length,
      totalTimeSpentSeconds: 0,
      lastActiveAt,
    };
  });

  const activeStudents = studentSummaries.filter(
    (s) => s.lastActiveAt !== undefined && now - s.lastActiveAt < ACTIVE_WINDOW_MS
  ).length;

  const averageMastery =
    studentSummaries.length > 0
      ? Math.round(
          studentSummaries.reduce((sum, s) => sum + s.overallMastery, 0) /
            studentSummaries.length
        )
      : 0;

  return {
    totalStudents: studentIds.length,
    activeStudents,
    averageMastery,
    setStatistics,
    studentSummaries,
  };
}
