"use client";

import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Flashcard, FlashcardSet } from "@/types/flashcard";
import Link from "next/link";
import {
  getFlashcardSet,
  updateFlashcardSet,
  deleteFlashcardSet,
} from "@/services/flashcardService";

export default function EditFlashcardSetClient({ setId }: { setId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [set, setSet] = useState<FlashcardSet | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchFlashcardSet = async () => {
      try {
        const flashcardSet = await getFlashcardSet(setId);
        if (!flashcardSet) {
          setError("Flashcard set not found");
        } else if (flashcardSet.userId !== user.uid) {
          setError("You don't have permission to edit this flashcard set");
        } else {
          setSet(flashcardSet);
          setTitle(flashcardSet.title);
          setDescription(flashcardSet.description);
          setCards(flashcardSet.cards);
          setIsPublic(flashcardSet.isPublic);
        }
      } catch (err) {
        // Error already handled by UI state
        setError("Failed to load flashcard set. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlashcardSet();
  }, [user, setId]);

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
    setCards([
      ...cards,
      {
        id: crypto.randomUUID(),
        term: "",
        definition: "",
        createdAt: Date.now(),
      },
    ]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    if (!title.trim()) {
      setError("Please enter a title for your flashcard set");
      return;
    }

    if (cards.some((card) => !card.term.trim() || !card.definition.trim())) {
      setError("All cards must have both a term and definition");
      return;
    }

    try {
      setIsSaving(true);

      if (!user) {
        setError("You must be logged in to update a flashcard set");
        return;
      }

      await updateFlashcardSet(setId, user.uid, {
        title,
        description,
        cards,
        isPublic,
      });

      // Redirect to the flashcards page
      router.push("/flashcards");
    } catch (err) {
      // Error already handled by UI state
      setError("Failed to update flashcard set. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this flashcard set? This action cannot be undone."
      )
    ) {
      return;
    }

    if (!user) {
      setError("You must be logged in to delete a flashcard set");
      return;
    }

    try {
      setIsDeleting(true);
      await deleteFlashcardSet(setId, user.uid);
      router.push("/flashcards");
    } catch (err) {
      // Error already handled by UI state
      setError("Failed to delete flashcard set. Please try again.");
      setIsDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Edit Flashcard Set</h1>
        <p>Please sign in to edit flashcard sets.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Edit Flashcard Set</h1>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error && !set) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Edit Flashcard Set</h1>
        <p className="text-red-500">{error}</p>
        <Link
          href="/flashcards"
          className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          Back to Flashcards
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/flashcards" className="text-blue-600 hover:text-blue-800">
          ← Back to Flashcards
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">Edit Flashcard Set</h1>

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
              key={card.id}
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

        <div className="flex justify-between">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete Set"}
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
