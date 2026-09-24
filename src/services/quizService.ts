import { logger } from "@/utils/logger";
import { CACHE_KEYS } from "@/constants/appConstants";
import { deduplicateRequest } from "@/utils/request";
import type { UserId } from "@/types/common";

interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  userId: UserId;
  createdAt: number;
  updatedAt: number;
  isPublic: boolean;
}

/**
 * Fetch the quizzes visible to the current user
 */
export async function getAllQuizzes(): Promise<Quiz[]> {
  logger.info("Fetching all quizzes");

  return deduplicateRequest(CACHE_KEYS.QUIZ.PUBLIC_QUIZZES, async () => {
    const response = await fetch("/api/quizzes");

    if (!response.ok) {
      throw new Error("Failed to fetch quizzes");
    }

    const quizzes = await response.json();
    return quizzes;
  });
}
