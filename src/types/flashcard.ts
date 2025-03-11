export type Flashcard = {
  id: string;
  term: string;
  definition: string;
  createdAt: number;
};

export type FlashcardSet = {
  id: string;
  title: string;
  description: string;
  cards: Flashcard[];
  userId: string;
  createdAt: number;
  updatedAt: number;
  isPublic: boolean;
};

// Add utility types for form handling
export type FlashcardFormData = Omit<Flashcard, "id" | "createdAt">;
export type FlashcardSetFormData = Omit<
  FlashcardSet,
  "id" | "userId" | "createdAt" | "updatedAt" | "cards"
> & {
  cards: FlashcardFormData[];
};
