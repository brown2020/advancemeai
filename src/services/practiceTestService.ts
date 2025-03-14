import { logger } from "@/utils/logger";
import { measureAsyncPerformance } from "@/utils/performance";
import { Cache } from "@/utils/cache";
import { tryCatch, createNotFoundError } from "@/utils/errorUtils";
import { TIMING, API_ENDPOINTS, CACHE_CONFIG } from "@/constants/appConstants";
import useSWR from "swr";

// SWR configuration
const SWR_CONFIG = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  refreshInterval: TIMING.REFRESH_INTERVAL,
  dedupingInterval: 2000,
};

// Types
export type TestId = string;
export type UserId = string;
export type SectionId = string;

export interface TestQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface TestSection {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  timeLimit: number; // in minutes
}

export interface PracticeTest {
  id: TestId;
  title: string;
  description: string;
  sections: TestSection[];
  createdAt: number;
  updatedAt: number;
}

export interface TestAttempt {
  id: string;
  userId: string;
  sectionId: string;
  answers: Record<string, string>;
  score: number;
  totalQuestions: number;
  timeSpent: number; // in seconds
  completedAt: Date;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  difficulty: "easy" | "medium" | "hard" | number;
  explanation?: string;
}

// Cache keys
const CACHE_KEYS = {
  TESTS_KEY: "practice-tests",
  TEST_PREFIX: "test:",
  SECTION_PREFIX: "section:",
  USER_ATTEMPTS_PREFIX: "user-attempts:",
};

// Create a cache for practice tests
const testCache = new Cache<
  string,
  PracticeTest | PracticeTest[] | TestSection | TestQuestion[] | TestAttempt[]
>({
  expirationMs: TIMING.REFRESH_INTERVAL,
  enableLogs: process.env.NODE_ENV === "development",
  maxSize: 200,
});

// Pending promises for deduplication of in-flight requests
const pendingPromises: Record<string, Promise<any>> = {};

/**
 * Get the cache key for a specific test
 */
function getTestKey(testId: TestId): string {
  return `${CACHE_KEYS.TEST_PREFIX}${testId}`;
}

/**
 * Get the cache key for a specific section
 */
function getSectionKey(sectionId: SectionId): string {
  return `${CACHE_KEYS.SECTION_PREFIX}${sectionId}`;
}

/**
 * Get the cache key for a user's test attempts
 */
function getUserAttemptsKey(userId: UserId): string {
  return `${CACHE_KEYS.USER_ATTEMPTS_PREFIX}${userId}`;
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

// Mock data for test sections
const mockTestSections: TestSection[] = [
  {
    id: "reading",
    title: "Reading",
    description: "Test your reading comprehension skills",
    questionCount: 3,
    timeLimit: 30,
  },
  {
    id: "writing",
    title: "Writing",
    description: "Test your grammar and writing skills",
    questionCount: 2,
    timeLimit: 25,
  },
  {
    id: "math-no-calc",
    title: "Math (No Calculator)",
    description: "Test your math skills without a calculator",
    questionCount: 2,
    timeLimit: 20,
  },
  {
    id: "math-calc",
    title: "Math (Calculator)",
    description: "Test your math skills with a calculator",
    questionCount: 2,
    timeLimit: 25,
  },
];

/**
 * Fetches all available test sections
 * @returns {Promise<TestSection[]>} Array of test sections
 */
export async function getAllTestSections(): Promise<TestSection[]> {
  // In a real app, this would fetch from an API
  // For now, we'll return mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockTestSections);
    }, 500);
  });
}

/**
 * Fetches questions for a specific test section
 * @param {string} sectionId - ID of the test section
 * @returns {Promise<Question[]>} Array of questions for the section
 */
export async function getSectionQuestions(
  sectionId: string
): Promise<Question[]> {
  try {
    const response = await fetch(API_ENDPOINTS.PRACTICE.QUESTIONS(sectionId));

    if (!response.ok) {
      throw new Error(`Failed to fetch questions for section ${sectionId}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching section questions:", error);
    throw error;
  }
}

/**
 * Submits a test attempt
 * @param {Omit<TestAttempt, 'id'>} attempt - Test attempt data without ID
 * @returns {Promise<TestAttempt>} Submitted test attempt with ID
 */
export async function submitTestAttempt(
  attempt: Omit<TestAttempt, "id">
): Promise<TestAttempt> {
  // In a real app, this would submit to an API
  // For now, we'll mock a successful submission
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ...attempt,
        id: `attempt-${Date.now()}`,
        completedAt: new Date(),
      });
    }, 800);
  });
}

/**
 * Hook to fetch test sections with SWR caching
 * @returns {Object} SWR response with test sections data
 */
export function useTestSections() {
  return useSWR("test-sections", getAllTestSections, SWR_CONFIG);
}

/**
 * Hook to fetch questions for a specific section with SWR caching
 * @param {string} sectionId - ID of the test section
 * @returns {Object} SWR response with questions data
 */
export function useSectionQuestions(sectionId: string) {
  return useSWR(
    sectionId ? `section-questions-${sectionId}` : null,
    () => getSectionQuestions(sectionId),
    SWR_CONFIG
  );
}

/**
 * Get test attempts for a user
 */
export async function getUserTestAttempts(
  userId: UserId
): Promise<TestAttempt[]> {
  logger.info(`Fetching test attempts for user: ${userId}`);
  const cacheKey = getUserAttemptsKey(userId);

  return deduplicateRequest(cacheKey, async () => {
    const response = await fetch(`/api/users/${userId}/test-attempts`);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch user test attempts: ${response.statusText}`
      );
    }

    const attempts = await response.json();
    return attempts;
  }) as Promise<TestAttempt[]>;
}

/**
 * Get a specific test attempt
 */
export async function getTestAttempt(attemptId: string): Promise<TestAttempt> {
  logger.info(`Fetching test attempt: ${attemptId}`);

  const response = await fetch(`/api/test-attempts/${attemptId}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw createNotFoundError("Test attempt", attemptId);
    }
    throw new Error(`Failed to fetch test attempt: ${response.statusText}`);
  }

  const attempt = await response.json();
  return attempt;
}

/**
 * Get cache statistics for monitoring
 */
export function getTestCacheStats() {
  return testCache.getStats();
}
