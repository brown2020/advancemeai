/**
 * Default settings for flashcards
 */
export const DEFAULT_FLASHCARD_SETTINGS = {
  // Display settings
  cardSize: "medium", // 'small' | 'medium' | 'large'
  showCardCount: true,
  showCreationDate: true,

  // Sorting settings
  sortBy: "updatedAt", // 'title' | 'createdAt' | 'updatedAt' | 'cardCount'
  sortDirection: "desc", // 'asc' | 'desc'

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
 * Cache keys for flashcard data
 */
export const CACHE_KEYS = {
  USER_SETS_PREFIX: "user-sets:",
  PUBLIC_SETS_KEY: "public-sets",
  SET_PREFIX: "set:",
};

/**
 * Cache configuration for flashcard data
 */
export const CACHE_CONFIG = {
  expirationMs: 10 * 60 * 1000, // 10 minutes
  maxSize: 200, // Limit cache size to prevent memory issues
};
