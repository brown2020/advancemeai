import type { Question } from "@/types/question";
import type {
  FullTestResults,
  FullTestSectionAttempt,
  FullTestSession,
} from "@/types/practice-test";
import { DIGITAL_SAT_SECTIONS } from "@/constants/sat";

type PracticeQuestionSource = "reading" | "writing" | "math-calc";

export async function fetchPracticeQuestions(
  sectionKey: PracticeQuestionSource,
  count: number
): Promise<{ questions: Question[]; readingPassage?: string | null }> {
  const response = await fetch(`/api/questions/${sectionKey}?count=${count}`, {
    credentials: "include",
  });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      body && typeof body === "object" && "error" in body
        ? String(body.error)
        : "Failed to fetch practice questions";
    throw new Error(message);
  }
  return response.json();
}

export function createLocalSession(userId: string): FullTestSession {
  return {
    id: `local-${Date.now()}`,
    userId,
    status: "in_progress",
    sections: DIGITAL_SAT_SECTIONS.map((section) => ({
      id: section.id,
      title: section.title,
      description: section.description,
      questionCount: section.questionCount,
      timeLimitMinutes: section.timeLimitMinutes,
    })),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function buildLocalResults(
  sessionId: string,
  userId: string,
  attempts: FullTestSectionAttempt[]
): FullTestResults {
  const accuracy = (attempt: FullTestSectionAttempt) =>
    attempt.totalQuestions > 0 ? attempt.score / attempt.totalQuestions : null;

  return {
    id: `local-results-${Date.now()}`,
    sessionId,
    userId,
    status: "completed",
    sections: attempts,
    totalScore: attempts.reduce((sum, a) => sum + a.score, 0),
    totalQuestions: attempts.reduce((sum, a) => sum + a.totalQuestions, 0),
    totalTimeSeconds: attempts.reduce((sum, a) => sum + a.timeSpentSeconds, 0),
    completedAt: Date.now(),
    strengths: attempts
      .filter((a) => (accuracy(a) ?? 0) >= 0.8)
      .map((a) => a.sectionId),
    weaknesses: attempts
      .filter((a) => {
        const value = accuracy(a);
        return value !== null && value <= 0.6;
      })
      .map((a) => a.sectionId),
  };
}

export function countCorrect(
  questions: Question[],
  answers: Record<string, string>
): number {
  return questions.reduce(
    (acc, question) =>
      acc + (answers[question.id] === question.correctAnswer ? 1 : 0),
    0
  );
}
