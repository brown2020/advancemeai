/**
 * Application-wide constants
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
