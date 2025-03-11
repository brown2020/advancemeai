// Add more specific utility types
export type FlashcardId = string;
export type UserId = string;

export type Flashcard = {
  id: FlashcardId;
  term: string;
  definition: string;
  createdAt: number;
};

export type FlashcardSet = {
  id: FlashcardId;
  title: string;
  description: string;
  cards: Flashcard[];
  userId: UserId;
  createdAt: number;
  updatedAt: number;
  isPublic: boolean;
};

// More specific form types
export type FlashcardFormData = Omit<Flashcard, "id" | "createdAt">;
export type FlashcardSetFormData = Omit<
  FlashcardSet,
  "id" | "userId" | "createdAt" | "updatedAt" | "cards"
> & {
  cards: FlashcardFormData[];
};

// Add readonly types for immutable data
export type ReadonlyFlashcard = Readonly<Flashcard>;
export type ReadonlyFlashcardSet = Readonly<{
  id: FlashcardId;
  title: string;
  description: string;
  cards: ReadonlyArray<ReadonlyFlashcard>;
  userId: UserId;
  createdAt: number;
  updatedAt: number;
  isPublic: boolean;
}>;
