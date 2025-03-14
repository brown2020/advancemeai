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
  questionsData?: Array<{
    id: string;
    text: string;
    correctAnswer: string;
    options: string[];
    explanation?: string;
  }>;
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

// Local storage key for test attempts
const TEST_ATTEMPTS_STORAGE_KEY = "test-attempts";

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
    description:
      "Practice reading comprehension with AI-generated questions based on passages",
    questionCount: 0, // Will be determined by user selection
    timeLimit: 0, // Will be determined by user selection
  },
  {
    id: "writing",
    title: "Writing",
    description:
      "Improve your grammar and writing skills with AI-generated practice questions",
    questionCount: 0, // Will be determined by user selection
    timeLimit: 0, // Will be determined by user selection
  },
  {
    id: "math-no-calc",
    title: "Math (No Calculator)",
    description:
      "Practice math concepts without a calculator using AI-generated questions",
    questionCount: 0, // Will be determined by user selection
    timeLimit: 0, // Will be determined by user selection
  },
  {
    id: "math-calc",
    title: "Math (Calculator)",
    description:
      "Practice math problems with a calculator using AI-generated questions",
    questionCount: 0, // Will be determined by user selection
    timeLimit: 0, // Will be determined by user selection
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
 * Get all test attempts from local storage
 */
function getAllTestAttemptsFromStorage(): Record<string, TestAttempt> {
  try {
    const attemptsJson = localStorage.getItem(TEST_ATTEMPTS_STORAGE_KEY);
    return attemptsJson ? JSON.parse(attemptsJson) : {};
  } catch (error) {
    console.error("Failed to get test attempts from storage:", error);
    return {};
  }
}

/**
 * Save a test attempt to local storage
 */
function saveTestAttemptToStorage(attempt: TestAttempt): void {
  try {
    const attempts = getAllTestAttemptsFromStorage();
    attempts[attempt.id] = attempt;
    localStorage.setItem(TEST_ATTEMPTS_STORAGE_KEY, JSON.stringify(attempts));
  } catch (error) {
    console.error("Failed to save test attempt to storage:", error);
  }
}

/**
 * Get a test attempt from local storage
 */
function getTestAttemptFromStorage(attemptId: string): TestAttempt | null {
  try {
    const attempts = getAllTestAttemptsFromStorage();
    return attempts[attemptId] || null;
  } catch (error) {
    console.error("Failed to get test attempt from storage:", error);
    return null;
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
  // For now, we'll create a local storage entry
  const newAttempt = {
    ...attempt,
    id: `attempt-${Date.now()}`,
    completedAt: new Date(),
  };

  // Save to local storage
  saveTestAttemptToStorage(newAttempt);

  return Promise.resolve(newAttempt);
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
 * Get a specific test attempt by ID
 */
export async function getTestAttempt(attemptId: string): Promise<TestAttempt> {
  logger.info(`Fetching test attempt: ${attemptId}`);

  // Try to get from local storage first
  const storedAttempt = getTestAttemptFromStorage(attemptId);
  if (storedAttempt) {
    return Promise.resolve(storedAttempt);
  }

  // If not in local storage, return a mock test attempt for development
  // In a real app, we would fetch from an API
  return Promise.resolve({
    id: attemptId,
    userId: "user123",
    sectionId: "reading", // Using a valid section ID
    answers: {
      q1: "Paris", // Correct
      q2: "5", // Incorrect
      q3: "William Shakespeare", // Correct
    },
    score: 2,
    totalQuestions: 3,
    timeSpent: 300, // 5 minutes
    completedAt: new Date(),
    questionsData: [
      {
        id: "q1",
        text: "What is the capital of France?",
        correctAnswer: "Paris",
        options: ["London", "Paris", "Berlin", "Madrid"],
      },
      {
        id: "q2",
        text: "What is 2 + 2?",
        correctAnswer: "4",
        options: ["3", "4", "5", "6"],
      },
      {
        id: "q3",
        text: "Who wrote Romeo and Juliet?",
        correctAnswer: "William Shakespeare",
        options: [
          "Charles Dickens",
          "William Shakespeare",
          "Jane Austen",
          "Mark Twain",
        ],
      },
    ],
  });
}

/**
 * Get cache statistics for monitoring
 */
export function getTestCacheStats() {
  return testCache.getStats();
}
