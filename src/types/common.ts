/**
 * Common type definitions shared across the application
 * Single source of truth for primitive types
 */

// Entity identifiers
export type UserId = string;
export type EntityId = string;

// Timestamp type for consistency
export type Timestamp = number;

// Re-export domain-specific types
export * from "./flashcard";
export * from "./question";
