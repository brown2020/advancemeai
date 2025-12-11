import { logger } from "@/utils/logger";
import { measureAsyncPerformance } from "@/utils/performance";
import { Cache } from "@/utils/cache";
import { tryCatch, createNotFoundError } from "@/utils/errorUtils";
import { CACHE_CONFIG, CACHE_KEYS } from "@/constants/appConstants";
import { deduplicateRequest } from "@/utils/request";
import type { UserId } from "@/types/common";

// Types
export type QuizId = string;

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
}

export interface Quiz {
  id: QuizId;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  userId: UserId;
  createdAt: number;
  updatedAt: number;
  isPublic: boolean;
}

export type QuizFormData = Omit<
  Quiz,
  "id" | "userId" | "createdAt" | "updatedAt"
>;

// Lazy-initialized cache for SSR safety
let quizCache: Cache<string, Quiz | Quiz[]> | null = null;

function getQuizCache(): Cache<string, Quiz | Quiz[]> {
  if (!quizCache) {
    quizCache = new Cache<string, Quiz | Quiz[]>({
      expirationMs: CACHE_CONFIG.expirationMs,
      enableLogs: process.env.NODE_ENV === "development",
      maxSize: CACHE_CONFIG.maxSize,
    });
  }
  return quizCache;
}

/**
 * Fetch all quizzes
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

/**
 * Fetch a specific quiz by ID
 */
export async function getQuiz(quizId: QuizId): Promise<Quiz> {
  logger.info(`Fetching quiz: ${quizId}`);
  const cacheKey = CACHE_KEYS.QUIZ.QUIZ(quizId);

  return deduplicateRequest(cacheKey, async () => {
    const response = await fetch(`/api/quizzes/${quizId}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw createNotFoundError("Quiz", quizId);
      }
      throw new Error(`Failed to fetch quiz: ${response.statusText}`);
    }

    const quiz = await response.json();
    return quiz;
  });
}

/**
 * Fetch quizzes for a specific user
 */
export async function getUserQuizzes(userId: UserId): Promise<Quiz[]> {
  logger.info(`Fetching quizzes for user: ${userId}`);
  const cacheKey = CACHE_KEYS.QUIZ.USER_QUIZZES(userId);

  return deduplicateRequest(cacheKey, async () => {
    const response = await fetch(`/api/users/${userId}/quizzes`);

    if (!response.ok) {
      throw new Error(`Failed to fetch user quizzes: ${response.statusText}`);
    }

    const quizzes = await response.json();
    return quizzes;
  });
}

/**
 * Create a new quiz
 */
export async function createQuiz(
  userId: UserId,
  quizData: QuizFormData
): Promise<QuizId> {
  logger.info(`Creating quiz for user: ${userId}`);

  const [result, error] = await tryCatch(async () => {
    const response = await fetch("/api/quizzes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...quizData,
        userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create quiz: ${response.statusText}`);
    }

    const data = await response.json();
    return data.id;
  });

  if (error) {
    throw error;
  }

  // Invalidate user's quizzes cache
  getQuizCache().remove(CACHE_KEYS.QUIZ.USER_QUIZZES(userId));

  // If public, also invalidate public quizzes cache
  if (quizData.isPublic) {
    getQuizCache().remove(CACHE_KEYS.QUIZ.PUBLIC_QUIZZES);
  }

  return result as QuizId;
}

/**
 * Update an existing quiz
 */
export async function updateQuiz(
  quizId: QuizId,
  userId: UserId,
  updates: Partial<Omit<Quiz, "id" | "userId" | "createdAt">>
): Promise<void> {
  logger.info(`Updating quiz: ${quizId}`);

  // Get the quiz before updating to check if it's public
  let wasPublic = false;
  try {
    const existingQuiz = await getQuiz(quizId);
    wasPublic = existingQuiz.isPublic;
  } catch (error) {
    // If we can't get the quiz, proceed with the update
  }

  await measureAsyncPerformance(async () => {
    const response = await fetch(`/api/quizzes/${quizId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...updates,
        userId,
        updatedAt: Date.now(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update quiz: ${response.statusText}`);
    }
  }, "updateQuiz");

  // Invalidate related caches
  const cache = getQuizCache();
  cache.remove(CACHE_KEYS.QUIZ.QUIZ(quizId));
  cache.remove(CACHE_KEYS.QUIZ.USER_QUIZZES(userId));

  // If public status is changing or it was public, invalidate public quizzes
  if (updates.isPublic !== undefined || wasPublic) {
    cache.remove(CACHE_KEYS.QUIZ.PUBLIC_QUIZZES);
  }
}

/**
 * Delete a quiz
 */
export async function deleteQuiz(
  quizId: QuizId,
  userId: UserId
): Promise<void> {
  logger.info(`Deleting quiz: ${quizId}`);

  // Check if quiz is public before deleting
  let isPublic = false;
  try {
    const quiz = await getQuiz(quizId);
    isPublic = quiz.isPublic;
  } catch (error) {
    // If we can't get the quiz, assume it might be public to be safe
    isPublic = true;
  }

  await measureAsyncPerformance(async () => {
    const response = await fetch(`/api/quizzes/${quizId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete quiz: ${response.statusText}`);
    }
  }, "deleteQuiz");

  // Invalidate related caches
  const cache = getQuizCache();
  cache.remove(CACHE_KEYS.QUIZ.QUIZ(quizId));
  cache.remove(CACHE_KEYS.QUIZ.USER_QUIZZES(userId));

  if (isPublic) {
    cache.remove(CACHE_KEYS.QUIZ.PUBLIC_QUIZZES);
  }
}

/**
 * Get cache statistics for monitoring
 */
export function getQuizCacheStats() {
  return getQuizCache().getStats();
}
