import type { FlashcardSet } from "./flashcard";

export type DashboardGamificationSummary = {
  xp: number;
  level: number;
  currentStreak: number;
};

export type DashboardContinueStudying = {
  type: "practice" | "flashcards";
  href: string;
  title: string;
  subtitle: string;
};

export type DashboardData = {
  recentSets: FlashcardSet[];
  continueStudying: DashboardContinueStudying | null;
  gamification: DashboardGamificationSummary | null;
};
