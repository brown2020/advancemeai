import { logger } from "@/utils/logger";
import { measureAsyncPerformance } from "@/utils/performance";
import { Cache } from "@/utils/cache";
import { tryCatch, createNotFoundError } from "@/utils/errorUtils";
import { CACHE_CONFIG } from "@/constants/appConstants";

// Types
export type QuizId = string;
export type UserId = string;

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

// Cache keys
const CACHE_KEYS = {
  USER_QUIZZES_PREFIX: "user-quizzes:",
  PUBLIC_QUIZZES_KEY: "public-quizzes",
  QUIZ_PREFIX: "quiz:",
};

// Create a cache for quizzes
const quizCache = new Cache<string, Quiz | Quiz[]>({
  expirationMs: CACHE_CONFIG.expirationMs,
  enableLogs: process.env.NODE_ENV === "development",
  maxSize: CACHE_CONFIG.maxSize,
});

// Pending promises for deduplication of in-flight requests
const pendingPromises: Record<string, Promise<any>> = {};

/**
 * Get the cache key for a user's quizzes
 */
function getUserQuizzesKey(userId: UserId): string {
  return `${CACHE_KEYS.USER_QUIZZES_PREFIX}${userId}`;
}

/**
 * Get the cache key for a specific quiz
 */
function getQuizKey(quizId: QuizId): string {
  return `${CACHE_KEYS.QUIZ_PREFIX}${quizId}`;
}

/**
 * Deduplicate in-flight requests to prevent redundant API calls
 */
async function deduplicateRequest<T>(
  key: string,
  factory: () => Promise<T>
): Promise<T> {
  // If there's already a pending request for this key, return that promise
  if (key in pendingPromises) {
    return pendingPromises[key] as Promise<T>;
  }

  // Otherwise, create a new promise and store it
  const promise = factory().finally(() => {
    // Clean up after the promise resolves or rejects
    delete pendingPromises[key];
  });

  pendingPromises[key] = promise;
  return promise;
}

/**
 * Fetch all quizzes
 */
export async function getAllQuizzes(): Promise<Quiz[]> {
  logger.info("Fetching all quizzes");

  return deduplicateRequest(CACHE_KEYS.PUBLIC_QUIZZES_KEY, async () => {
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
  const cacheKey = getQuizKey(quizId);

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
  const cacheKey = getUserQuizzesKey(userId);

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
  quizCache.remove(getUserQuizzesKey(userId));

  // If public, also invalidate public quizzes cache
  if (quizData.isPublic) {
    quizCache.remove(CACHE_KEYS.PUBLIC_QUIZZES_KEY);
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
  quizCache.remove(getQuizKey(quizId));
  quizCache.remove(getUserQuizzesKey(userId));

  // If public status is changing or it was public, invalidate public quizzes
  if (updates.isPublic !== undefined || wasPublic) {
    quizCache.remove(CACHE_KEYS.PUBLIC_QUIZZES_KEY);
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
  quizCache.remove(getQuizKey(quizId));
  quizCache.remove(getUserQuizzesKey(userId));

  if (isPublic) {
    quizCache.remove(CACHE_KEYS.PUBLIC_QUIZZES_KEY);
  }
}

/**
 * Get cache statistics for monitoring
 */
export function getQuizCacheStats() {
  return quizCache.getStats();
}
