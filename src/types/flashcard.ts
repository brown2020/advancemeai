/**
 * Core flashcard type definitions
 * Single source of truth for flashcard-related types
 */

import type { UserId, Timestamp } from "./common";

// Basic types
export type FlashcardId = string;

// Re-export for backward compatibility
export type { UserId, Timestamp };

/**
 * Visibility options for flashcard sets
 */
export type FlashcardVisibility = "public" | "unlisted" | "private";

/**
 * Represents a single flashcard
 */
export interface Flashcard {
  /** Unique identifier for the flashcard */
  id: FlashcardId;
  /** The term or question on the front of the card */
  term: string;
  /** The definition or answer on the back of the card */
  definition: string;
  /** Optional image URL for the term side */
  termImageUrl?: string;
  /** Optional image URL for the definition side */
  definitionImageUrl?: string;
  /** When the flashcard was created */
  createdAt: Timestamp;
}

/**
 * Represents a collection of flashcards
 */
export interface FlashcardSet {
  /** Unique identifier for the set */
  id: FlashcardId;
  /** Title of the flashcard set */
  title: string;
  /** Optional description of the set */
  description: string;
  /** Collection of flashcards in this set */
  cards: Flashcard[];
  /** User who owns this set */
  userId: UserId;
  /** When the set was created */
  createdAt: Timestamp;
  /** When the set was last updated */
  updatedAt: Timestamp;
  /** Whether the set is publicly accessible (legacy, use visibility) */
  isPublic: boolean;
  /** Visibility setting for the set */
  visibility?: FlashcardVisibility;
  /** Language of the terms (e.g., "en", "es") */
  termLanguage?: string;
  /** Language of the definitions (e.g., "en", "es") */
  definitionLanguage?: string;
  /** Subject tags for categorization */
  subjects?: string[];
  /** Number of times this set has been studied */
  timesStudied?: number;
  /** If copied, reference to original set */
  copiedFromSetId?: string;
  /** If copied, reference to original owner */
  copiedFromUserId?: string;
}

/**
 * Form data types for creating and editing
 */
export type FlashcardFormData = Omit<Flashcard, "id" | "createdAt">;

/**
 * Study mode options for flashcard study view
 */
export type StudyMode = "cards" | "learn" | "test" | "write" | "match";
