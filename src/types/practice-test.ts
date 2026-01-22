import type { Question } from "@/types/question";

export type FullTestSectionId = "reading-writing" | "math";
export type FullTestStatus = "in_progress" | "completed";

export type FullTestSectionConfig = {
  id: FullTestSectionId;
  title: string;
  description: string;
  questionCount: number;
  timeLimitMinutes: number;
};

export type FullTestSession = {
  id: string;
  userId: string;
  status: FullTestStatus;
  sections: FullTestSectionConfig[];
  createdAt: number;
  updatedAt: number;
};

export type FullTestSectionAttempt = {
  sectionId: FullTestSectionId;
  answers: Record<string, string>;
  score: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  questionsData?: Array<Pick<Question, "id" | "text" | "options" | "correctAnswer" | "explanation" | "sectionId">>;
};

export type FullTestResults = {
  id: string;
  sessionId: string;
  userId: string;
  status: FullTestStatus;
  sections: FullTestSectionAttempt[];
  totalScore: number;
  totalQuestions: number;
  totalTimeSeconds: number;
  completedAt: number;
  strengths: string[];
  weaknesses: string[];
};
