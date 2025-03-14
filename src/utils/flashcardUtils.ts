import { FlashcardSet } from "@/types/flashcard";
import { FlashcardSettings } from "@/hooks/useFlashcardSettings";

/**
 * Sort function for flashcard sets
 * @param sets - The flashcard sets to sort
 * @param sortBy - The field to sort by
 * @param sortDirection - The direction to sort (asc or desc)
 * @returns The sorted flashcard sets
 */
export const sortFlashcardSets = (
  sets: FlashcardSet[],
  sortBy: keyof Pick<FlashcardSettings, "sortBy"> | string,
  sortDirection: "asc" | "desc"
): FlashcardSet[] => {
  const sortedSets = [...sets];

  sortedSets.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "title":
        comparison = a.title.localeCompare(b.title);
        break;
      case "createdAt":
        comparison = a.createdAt - b.createdAt;
        break;
      case "updatedAt":
        comparison = a.updatedAt - b.updatedAt;
        break;
      case "cardCount":
        comparison = a.cards.length - b.cards.length;
        break;
      default:
        comparison = a.updatedAt - b.updatedAt;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  return sortedSets;
};

/**
 * Validate a flashcard set
 * @param title - The title of the flashcard set
 * @param cards - The cards in the flashcard set
 * @returns An error message if validation fails, null otherwise
 */
export const validateFlashcardSet = (
  title: string,
  cards: { term: string; definition: string }[]
): string | null => {
  if (!title.trim()) {
    return "Title is required";
  }

  if (cards.length < 2) {
    return "A flashcard set must have at least 2 cards";
  }

  for (let i = 0; i < cards.length; i++) {
    if (!cards[i].term.trim() || !cards[i].definition.trim()) {
      return `Card ${
        i + 1
      } is incomplete. Both term and definition are required.`;
    }
  }

  return null;
};
