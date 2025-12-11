/**
 * Application-wide constants
 * Consolidated from multiple files for DRY compliance
 */

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  AUTH_USER: "auth-user",
  THEME: "app-theme",
  SETTINGS_PREFIX: "settings-",
};

/**
 * Flashcard validation limits
 */
export const FLASHCARD_LIMITS = {
  MIN_CARDS: 2,
  MAX_CARDS: 500,
  MAX_TERM_LENGTH: 200,
  MAX_DEFINITION_LENGTH: 1000,
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 500,
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
 * API endpoints
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    REGISTER: "/api/auth/register",
    CURRENT_USER: "/api/auth/me",
  },
  FLASHCARDS: {
    BASE: "/api/flashcards",
    SET: (id: string) => `/api/flashcards/${id}`,
    USER_SETS: (userId: string) => `/api/users/${userId}/flashcards`,
    PUBLIC: "/api/flashcards/public",
  },
  QUIZZES: {
    BASE: "/api/quizzes",
    QUIZ: (id: string) => `/api/quizzes/${id}`,
    USER_QUIZZES: (userId: string) => `/api/users/${userId}/quizzes`,
  },
  USERS: {
    BASE: "/api/users",
    USER: (id: string) => `/api/users/${id}`,
    PROFILE: "/api/users/profile",
  },
  PRACTICE: {
    QUESTIONS: (sectionId: string) => `/api/questions/${sectionId}`,
    TEST_ATTEMPTS: "/api/test-attempts",
    USER_ATTEMPTS: (userId: string) => `/api/users/${userId}/test-attempts`,
  },
};

/**
 * Route paths
 */
export const ROUTES = {
  HOME: "/",
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    FORGOT_PASSWORD: "/auth/forgot-password",
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
  },
  PROFILE: {
    INDEX: "/profile",
    SETTINGS: "/profile/settings",
  },
};

/**
 * Pagination defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
};

/**
 * Timing constants
 */
export const TIMING = {
  DEBOUNCE_DELAY: 300, // ms
  AUTO_SAVE_DELAY: 2000, // ms
  TOAST_DURATION: 5000, // ms
  REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes
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
