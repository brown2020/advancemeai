"use client";

import { useAuth } from "@/lib/auth";
import { useState, useEffect, useCallback, useMemo } from "react";
import { FlashcardSet } from "@/types/flashcard";
import Link from "next/link";
import { getFlashcardSet } from "@/services/flashcardService";

export default function StudyFlashcardSetClient({ setId }: { setId: string }) {
  const { user } = useAuth();
  const [set, setSet] = useState<FlashcardSet | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studyMode, setStudyMode] = useState<"cards" | "learn" | "test">(
    "cards"
  );

  // Define hooks at the top level, not conditionally
  const nextCard = useCallback(() => {
    if (set && currentCardIndex < set.cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    }
  }, [currentCardIndex, set]);

  const prevCard = useCallback(() => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  }, [currentCardIndex]);

  const flipCard = useCallback(() => {
    setIsFlipped(!isFlipped);
  }, [isFlipped]);

  // Use useMemo at the top level
  const currentCard = useMemo(
    () => (set && set.cards.length > 0 ? set.cards[currentCardIndex] : null),
    [set, currentCardIndex]
  );

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    let isMounted = true; // For cleanup

    const fetchFlashcardSet = async () => {
      try {
        const flashcardSet = await getFlashcardSet(setId);
        if (!isMounted) return; // Prevent state updates if unmounted

        if (!flashcardSet) {
          setError("Flashcard set not found");
        } else {
          setSet(flashcardSet);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Error fetching flashcard set:", err);
        setError("Failed to load flashcard set. Please try again.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchFlashcardSet();

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, [user, setId]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Study Flashcards</h1>
        <p>Please sign in to study flashcards.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Study Flashcards</h1>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !set) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Study Flashcards</h1>
        <p className="text-red-500">{error || "Flashcard set not found."}</p>
        <Link
          href="/flashcards"
          className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          Back to Flashcards
        </Link>
      </div>
    );
  }

  if (set.cards.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Study Flashcards</h1>
        <p>This flashcard set has no cards.</p>
        <Link
          href="/flashcards"
          className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          Back to Flashcards
        </Link>
      </div>
    );
  }

  // Extract study mode rendering to separate components
  const renderCardMode = () => {
    if (!currentCard) return null;

    return (
      <>
        <div className="mb-4 text-center">
          <span className="text-gray-600 dark:text-gray-300">
            Card {currentCardIndex + 1} of {set.cards.length}
          </span>
        </div>

        <div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 mb-6 min-h-[300px] flex items-center justify-center cursor-pointer transition-transform duration-500 transform hover:scale-105"
          onClick={flipCard}
          role="button"
          tabIndex={0}
          aria-label={`Flashcard: ${isFlipped ? "definition" : "term"}`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              flipCard();
              e.preventDefault();
            }
          }}
          style={{ perspective: "1000px" }}
        >
          <div
            className={`w-full text-center transition-transform duration-500 ${
              isFlipped ? "scale-x-[-1]" : ""
            }`}
          >
            <h2 className="text-2xl font-bold mb-2">
              {isFlipped ? currentCard.definition : currentCard.term}
            </h2>
            <p className="text-gray-500 text-sm mt-4">
              Click to {isFlipped ? "see term" : "see definition"}
            </p>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={prevCard}
            disabled={currentCardIndex === 0}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={nextCard}
            disabled={currentCardIndex === set.cards.length - 1}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/flashcards" className="text-blue-600 hover:text-blue-800">
          ← Back to Flashcards
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{set.title}</h1>
          <p className="text-gray-600 dark:text-gray-300">{set.description}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setStudyMode("cards")}
            className={`px-3 py-1 rounded-lg ${
              studyMode === "cards"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            Flashcards
          </button>
          <button
            onClick={() => setStudyMode("learn")}
            className={`px-3 py-1 rounded-lg ${
              studyMode === "learn"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            Learn
          </button>
          <button
            onClick={() => setStudyMode("test")}
            className={`px-3 py-1 rounded-lg ${
              studyMode === "test"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            Test
          </button>
        </div>
      </div>

      {studyMode === "cards" && renderCardMode()}

      {studyMode === "learn" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <p className="text-center text-lg mb-4">
            Learn mode is coming soon! This mode will help you memorize cards
            through spaced repetition.
          </p>
        </div>
      )}

      {studyMode === "test" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <p className="text-center text-lg mb-4">
            Test mode is coming soon! This mode will quiz you on the flashcards
            to test your knowledge.
          </p>
        </div>
      )}
    </div>
  );
}
