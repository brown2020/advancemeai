"use client";

import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flashcard } from "@/types/flashcard";
import { createFlashcardSet } from "@/services/flashcardService";
import { validateFlashcardSet } from "@/utils/flashcardUtils";
import {
  UnauthorizedState,
  ErrorDisplay,
} from "@/components/flashcards/FlashcardComponents";

export default function CreateFlashcardSetPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cards, setCards] = useState<Omit<Flashcard, "id" | "createdAt">[]>([
    { term: "", definition: "" },
    { term: "", definition: "" },
  ]);
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return <UnauthorizedState title="Create Flashcard Set" />;
  }

  const handleCardChange = (
    index: number,
    field: "term" | "definition",
    value: string
  ) => {
    const newCards = [...cards];
    newCards[index] = { ...newCards[index], [field]: value };
    setCards(newCards);
  };

  const addCard = () => {
    setCards([...cards, { term: "", definition: "" }]);
  };

  const removeCard = (index: number) => {
    if (cards.length <= 2) {
      setError("A flashcard set must have at least 2 cards");
      return;
    }
    const newCards = [...cards];
    newCards.splice(index, 1);
    setCards(newCards);
  };

  const validateForm = () => {
    const validationError = validateFlashcardSet(title, cards);
    if (validationError) {
      setError(validationError);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      // Trim all inputs before sending to database
      const trimmedCards = cards.map((card) => ({
        term: card.term.trim(),
        definition: card.definition.trim(),
      }));

      await createFlashcardSet(
        user.uid,
        title.trim(),
        description.trim(),
        trimmedCards,
        isPublic
      );

      // Redirect to the flashcards page
      router.push("/flashcards");
    } catch (err) {
      console.error("Error creating flashcard set:", err);
      setError("Failed to create flashcard set. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Create New Flashcard Set</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., Biology Terms"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Add a description for your flashcard set"
              rows={3}
            />
          </div>

          <div className="mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="rounded text-blue-600"
              />
              <span>Make this set public</span>
            </label>
          </div>
        </div>

        <h2 className="text-xl font-semibold mb-4">Cards</h2>

        <div className="space-y-4 mb-6">
          {cards.map((card, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 flex flex-col md:flex-row gap-4"
            >
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Term</label>
                <input
                  type="text"
                  value={card.term}
                  onChange={(e) =>
                    handleCardChange(index, "term", e.target.value)
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter term"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">
                  Definition
                </label>
                <input
                  type="text"
                  value={card.definition}
                  onChange={(e) =>
                    handleCardChange(index, "definition", e.target.value)
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter definition"
                  required
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => removeCard(index)}
                  className="px-3 py-2 text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <button
            type="button"
            onClick={addCard}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors"
          >
            + Add Card
          </button>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Creating..." : "Create Flashcard Set"}
          </button>
        </div>
      </form>
    </div>
  );
}
