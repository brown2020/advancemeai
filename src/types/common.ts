/**
 * Common type definitions shared across the application
 * Single source of truth for primitive types
 */

// Entity identifiers
export type UserId = string;
export type EntityId = string;

// Timestamp type for consistency
export type Timestamp = number;

// Section IDs for practice tests
export type SectionId = "reading" | "writing" | "math-calc" | "math-no-calc";

// Difficulty levels
export type Difficulty = "easy" | "medium" | "hard";
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;
