/**
 * Core flashcard type definitions
 * Single source of truth for flashcard-related types
 */

// Basic types
export type FlashcardId = string;
export type UserId = string;
export type Timestamp = number;

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
  /** Whether the set is publicly accessible */
  isPublic: boolean;
}

/**
 * Form data types for creating and editing
 */
export type FlashcardFormData = Omit<Flashcard, "id" | "createdAt">;

/**
 * Study mode options for flashcard study view
 */
export type StudyMode = "cards" | "learn" | "test";
