/**
 * Class Progress type definitions
 * Tracks student progress within a class/study group
 */

import type { Timestamp, UserId } from "./common";
import type { StudyGroupId } from "./study-group";
import type { FlashcardId } from "./flashcard";

export type ProgressId = string;

/**
 * Progress for a single set within a class
 */
export interface SetProgress {
  setId: FlashcardId;
  /** Number of cards the student has studied */
  cardsStudied: number;
  /** Number of cards the student has mastered (mastery level 3) */
  cardsMastered: number;
  /** Total cards in the set */
  totalCards: number;
  /** Overall mastery percentage (0-100) */
  masteryPercentage: number;
  /** Total time spent studying this set in seconds */
  timeSpentSeconds: number;
  /** Number of study sessions for this set */
  studySessions: number;
  /** When the student first studied this set */
  firstStudiedAt?: Timestamp;
  /** When the student last studied this set */
  lastStudiedAt?: Timestamp;
}

/**
 * Student's progress within a class
 */
export interface StudentClassProgress {
  id: ProgressId;
  /** The class/study group ID */
  classId: StudyGroupId;
  /** The student's user ID */
  userId: UserId;
  /** Progress for each assigned set */
  setProgress: Record<FlashcardId, SetProgress>;
  /** Overall statistics */
  totalCardsStudied: number;
  totalCardsMastered: number;
  totalTimeSpentSeconds: number;
  totalStudySessions: number;
  /** Overall mastery across all sets (0-100) */
  overallMastery: number;
  /** When this record was last updated */
  updatedAt: Timestamp;
}

/**
 * Class-wide statistics for a specific set
 */
export interface ClassSetStatistics {
  setId: FlashcardId;
  setTitle: string;
  /** Number of students who have studied this set */
  studentsStarted: number;
  /** Number of students who have completed (80%+ mastery) */
  studentsCompleted: number;
  /** Total students in the class */
  totalStudents: number;
  /** Average mastery percentage across all students */
  averageMastery: number;
  /** Average time spent (seconds) by students who studied */
  averageTimeSpent: number;
}

/**
 * Overall class statistics
 */
export interface ClassStatistics {
  classId: StudyGroupId;
  /** Total number of students */
  totalStudents: number;
  /** Number of active students (studied in last 7 days) */
  activeStudents: number;
  /** Number of assigned sets */
  totalSets: number;
  /** Class-wide average mastery */
  averageMastery: number;
  /** Statistics per set */
  setStatistics: ClassSetStatistics[];
  /** When these statistics were last calculated */
  calculatedAt: Timestamp;
}

/**
 * Student summary for class roster view
 */
export interface StudentSummary {
  userId: UserId;
  displayName: string;
  email?: string;
  role: "student" | "teacher";
  /** Overall mastery percentage */
  overallMastery: number;
  /** Number of sets completed (80%+ mastery) */
  setsCompleted: number;
  /** Total sets assigned */
  totalSets: number;
  /** Total study time */
  totalTimeSpentSeconds: number;
  /** Last activity timestamp */
  lastActiveAt?: Timestamp;
  /** XP earned */
  xp?: number;
  /** Current level */
  level?: number;
}

/**
 * Calculate mastery percentage from cards mastered and total
 */
export function calculateMasteryPercentage(
  cardsMastered: number,
  totalCards: number
): number {
  if (totalCards === 0) return 0;
  return Math.round((cardsMastered / totalCards) * 100);
}

/**
 * Calculate overall mastery from multiple set progresses
 */
export function calculateOverallMastery(
  setProgress: Record<FlashcardId, SetProgress>
): number {
  const progresses = Object.values(setProgress);
  if (progresses.length === 0) return 0;

  const totalMastered = progresses.reduce((sum, p) => sum + p.cardsMastered, 0);
  const totalCards = progresses.reduce((sum, p) => sum + p.totalCards, 0);

  return calculateMasteryPercentage(totalMastered, totalCards);
}

/**
 * Check if a set is considered "completed" (80%+ mastery)
 */
export function isSetCompleted(progress: SetProgress): boolean {
  return progress.masteryPercentage >= 80;
}

/**
 * Format time spent in human-readable format
 */
export function formatTimeSpent(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}
