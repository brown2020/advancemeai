import { logger } from "@/utils/logger";
import { deduplicateRequest } from "@/utils/request";
import type { UserId } from "@/types/common";
import type { Question } from "@/types/question";
import type {
  FullTestResults,
  FullTestSectionAttempt,
  FullTestSectionConfig,
  FullTestSession,
  FullTestSectionId,
} from "@/types/practice-test";
import { DIGITAL_SAT_SECTIONS } from "@/constants/sat";

// Types
export type TestId = string;
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

export type FullTestSectionResponse = {
  questions: Question[];
  readingPassage?: string | null;
};

export const FULL_TEST_SECTIONS: FullTestSectionConfig[] = DIGITAL_SAT_SECTIONS.map(
  (section) => ({
    id: section.id,
    title: section.title,
    description: section.description,
    questionCount: section.questionCount,
    timeLimitMinutes: section.timeLimitMinutes,
  })
);

// Cache key prefix for user attempts
const USER_ATTEMPTS_PREFIX = "user-attempts:";

// Local storage key for test attempts
const TEST_ATTEMPTS_STORAGE_KEY = "test-attempts";

/**
 * Get the cache key for a user's test attempts
 */
function getUserAttemptsKey(userId: UserId): string {
  return `${USER_ATTEMPTS_PREFIX}${userId}`;
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

export async function createFullTestSession(): Promise<FullTestSession> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  const response = await fetch("/api/practice-tests/sessions", {
    method: "POST",
    credentials: "include",
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId));

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      body && typeof body === "object" && "error" in body
        ? String(body.error)
        : "Failed to create practice test session";
    throw new Error(message);
  }

  return response.json();
}

export async function getFullTestSectionQuestions(
  sessionId: string,
  sectionId: FullTestSectionId,
  options?: { offset?: number; limit?: number; local?: boolean }
): Promise<FullTestSectionResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);
  const params = new URLSearchParams();
  if (typeof options?.offset === "number") {
    params.set("offset", String(options.offset));
  }
  if (typeof options?.limit === "number") {
    params.set("limit", String(options.limit));
  }
  if (options?.local) {
    params.set("local", "true");
  }
  const query = params.toString();
  const response = await fetch(
    `/api/practice-tests/sessions/${sessionId}/section/${sectionId}${
      query ? `?${query}` : ""
    }`,
    { credentials: "include", signal: controller.signal }
  ).finally(() => clearTimeout(timeoutId));

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      body && typeof body === "object" && "error" in body
        ? String(body.error)
        : "Failed to fetch section questions";
    throw new Error(message);
  }

  return response.json();
}

export async function submitFullTestSection(
  sessionId: string,
  sectionId: FullTestSectionId,
  payload: FullTestSectionAttempt
): Promise<void> {
  const response = await fetch(
    `/api/practice-tests/sessions/${sessionId}/section/${sectionId}/submit`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to submit section answers");
  }
}

export async function completeFullTestSession(
  sessionId: string
): Promise<FullTestResults> {
  const response = await fetch(
    `/api/practice-tests/sessions/${sessionId}/complete`,
    { method: "POST", credentials: "include" }
  );

  if (!response.ok) {
    throw new Error("Failed to complete practice test");
  }

  return response.json();
}

export async function getFullTestResults(
  sessionId: string
): Promise<FullTestResults> {
  const response = await fetch(
    `/api/practice-tests/sessions/${sessionId}/results`,
    { credentials: "include" }
  );

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      body && typeof body === "object" && "error" in body
        ? String(body.error)
        : "Failed to load practice test results";
    throw new Error(message);
  }

  return response.json();
}

/**
 * Get all test attempts from local storage
 */
function getAllTestAttemptsFromStorage(): Record<string, TestAttempt> {
  try {
    const attemptsJson = localStorage.getItem(TEST_ATTEMPTS_STORAGE_KEY);
    return attemptsJson ? JSON.parse(attemptsJson) : {};
  } catch (error) {
    logger.error("Failed to get test attempts from storage:", error);
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
    logger.error("Failed to save test attempt to storage:", error);
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
    logger.error("Failed to get test attempt from storage:", error);
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
