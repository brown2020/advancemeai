import {
  PracticeAttempt,
  PracticeMode,
  getConceptSummaries,
  recordPracticeAttempt,
} from "@/api/firebase/practiceProgressRepository";
import { Question } from "./practiceTestService";

export type AdaptiveRecommendation = {
  recommendedCount: number;
  focusConcepts: string[];
  suggestedDifficulty: "easy" | "medium" | "hard";
  avgTimeMs: number;
};

export async function saveAdaptiveAttempt(
  attempt: PracticeAttempt
): Promise<void> {
  await recordPracticeAttempt(attempt);
}

export async function getAdaptiveRecommendation(
  userId: string,
  sectionId: string
): Promise<AdaptiveRecommendation> {
  const summaries = await getConceptSummaries(userId, sectionId);
  if (!summaries.length) {
    return {
      recommendedCount: 5,
      focusConcepts: [],
      suggestedDifficulty: "medium",
      avgTimeMs: 60000,
    };
  }

  const weakest = summaries.slice(0, 3);
  const accuracy =
    summaries.reduce((sum, entry) => sum + entry.correct / entry.total, 0) /
    summaries.length;
  const avgTime =
    summaries.reduce((sum, entry) => sum + entry.avgTimeMs, 0) /
    summaries.length;

  const recommendedCount = accuracy > 0.8 ? 10 : accuracy > 0.6 ? 7 : 5;
  const suggestedDifficulty =
    accuracy > 0.85 ? "hard" : accuracy > 0.65 ? "medium" : "easy";

  return {
    recommendedCount,
    focusConcepts: weakest.map((entry) => entry.conceptId),
    suggestedDifficulty,
    avgTimeMs: avgTime,
  };
}

export function deriveConceptId(question: Question) {
  if ((question as any).conceptId) {
    return (question as any).conceptId as string;
  }
  return question.id;
}

export function deriveModeTimer(mode: PracticeMode, questionCount: number) {
  if (mode === "timed") {
    return questionCount * 75; // 75 seconds per question
  }
  if (mode === "micro") {
    return questionCount * 45;
  }
  return null;
}

