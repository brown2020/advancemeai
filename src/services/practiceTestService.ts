import { logger } from "@/utils/logger";
import type {
  FullTestResults,
  FullTestSectionAttempt,
  FullTestSession,
  FullTestSectionId,
} from "@/types/practice-test";

export interface TestSection {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  timeLimit: number; // in minutes
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

// Local storage key for test attempts
const TEST_ATTEMPTS_STORAGE_KEY = "test-attempts";

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
