/**
 * Represents a unique identifier for a flashcard
 */
export type FlashcardId = string;

/**
 * Represents a unique identifier for a user
 */
export type UserId = string;

/**
 * Represents a timestamp in milliseconds since epoch
 */
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
 * Form data for creating/editing a flashcard
 */
export type FlashcardFormData = Omit<Flashcard, "id" | "createdAt">;

/**
 * Form data for creating/editing a flashcard set
 */
export type FlashcardSetFormData = Omit<
  FlashcardSet,
  "id" | "userId" | "createdAt" | "updatedAt" | "cards"
> & {
  cards: FlashcardFormData[];
};

/**
 * Read-only version of a flashcard for display purposes
 */
export type ReadonlyFlashcard = Readonly<Flashcard>;

/**
 * Read-only version of a flashcard set for display purposes
 */
export type ReadonlyFlashcardSet = Readonly<{
  id: FlashcardId;
  title: string;
  description: string;
  cards: ReadonlyArray<ReadonlyFlashcard>;
  userId: UserId;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isPublic: boolean;
}>;
