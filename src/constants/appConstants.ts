/**
 * Application-wide constants
 * Consolidated from multiple files for DRY compliance
 */

/**
 * Section titles for practice tests
 */
export const SECTION_TITLES: Record<string, string> = {
  reading: "Reading Comprehension",
  writing: "Writing and Language",
  "math-no-calc": "Math (No Calculator)",
  "math-calc": "Math (Calculator)",
  "reading-writing": "Reading & Writing",
  math: "Math",
};

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  AUTH_USER: "auth-user",
  THEME: "app-theme",
  SETTINGS_PREFIX: "settings-",
};

/**
 * Default settings for flashcards
 */
export const DEFAULT_FLASHCARD_SETTINGS = {
  // Display settings
  cardSize: "medium" as const,
  showCardCount: true,
  showCreationDate: true,

  // Sorting settings
  sortBy: "updatedAt" as const,
  sortDirection: "desc" as const,

  // Study settings
  shuffleCards: true,
  autoFlip: false,
  autoFlipDelay: 5, // seconds

  // Performance settings
  prefetchSets: true,
  autoRefresh: true,
  refreshInterval: 5 * 60 * 1000, // 5 minutes
};

/**
 * Cache keys for all entities
 */
export const CACHE_KEYS = {
  // Flashcard cache keys
  FLASHCARD: {
    USER_SETS: (userId: string) => `user-flashcard-sets:${userId}`,
    PUBLIC_SETS: "public-flashcard-sets",
    SET: (id: string) => `flashcard-set:${id}`,
  },
  // Quiz cache keys
  QUIZ: {
    USER_QUIZZES: (userId: string) => `user-quizzes:${userId}`,
    PUBLIC_QUIZZES: "public-quizzes",
    QUIZ: (id: string) => `quiz:${id}`,
  },
  // Practice cache keys
  PRACTICE: {
    USER_ATTEMPTS: (userId: string) => `user-attempts:${userId}`,
  },
  // Legacy keys for backward compatibility
  USER_SETS_PREFIX: "user-sets:",
  PUBLIC_SETS_KEY: "public-sets",
  SET_PREFIX: "set:",
} as const;

/**
 * Route paths
 */
export const ROUTES = {
  HOME: "/",
  AUTH: {
    LOGIN: "/auth/signin",
    REGISTER: "/auth/signup",
  },
  FLASHCARDS: {
    INDEX: "/flashcards",
    CREATE: "/flashcards/create",
    SET: (id: string) => `/flashcards/${id}`,
    EDIT: (id: string) => `/flashcards/${id}/edit`,
    STUDY: (id: string) => `/flashcards/${id}/study`,
  },
  QUIZZES: {
    INDEX: "/quizzes",
    CREATE: "/quizzes/new",
    QUIZ: (id: string) => `/quizzes/${id}`,
    EDIT: (id: string) => `/quizzes/${id}/edit`,
    RESULTS: (id: string) => `/quizzes/${id}/results`,
  },
  PRACTICE: {
    INDEX: "/practice",
    SECTION: (sectionId: string) => `/practice/${sectionId}`,
    RESULTS: (attemptId: string) => `/practice/results/${attemptId}`,
    FULL_TEST: "/practice/full-test",
    FULL_TEST_RESULTS: (sessionId: string) =>
      `/practice/full-test/results/${sessionId}`,
  },
  PROFILE: {
    INDEX: "/profile",
    SETTINGS: "/profile/settings",
  },
};

/**
 * Theme constants
 */
export const THEMES = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
};

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
  expirationMs: 10 * 60 * 1000, // 10 minutes
  maxSize: 200, // Limit cache size to prevent memory issues
};
