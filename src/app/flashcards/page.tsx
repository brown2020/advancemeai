"use client";

import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import Link from "next/link";
import { FlashcardSet } from "@/types/flashcard";
import { getUserFlashcardSets } from "@/services/flashcardService";

const renderFlashcardSets = (sets: FlashcardSet[], isLoading: boolean) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (sets.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">No flashcard sets yet</h2>
        <p className="mb-4">Create your first set to start studying!</p>
        <Link
          href="/flashcards/create"
          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          Create New Set
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sets.map((set) => (
        <div
          key={set.id}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">{set.title}</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {set.description}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            {set.cards.length} cards • Created{" "}
            {new Date(set.createdAt).toLocaleDateString()}
          </p>
          <div className="flex space-x-2">
            <Link
              href={`/flashcards/${set.id}`}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Study
            </Link>
            <Link
              href={`/flashcards/${set.id}/edit`}
              className="px-3 py-1 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Edit
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
};

export default function FlashcardsPage() {
  const { user } = useAuth();
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchFlashcardSets = async () => {
      try {
        const userSets = await getUserFlashcardSets(user.uid);
        setSets(userSets);
      } catch (err) {
        console.error("Error fetching flashcard sets:", err);
        setError("Failed to load your flashcard sets. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlashcardSets();
  }, [user]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Flashcards</h1>
        <p>Please sign in to view your flashcard sets.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Flashcard Sets</h1>
        <Link
          href="/flashcards/create"
          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          Create New Set
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {renderFlashcardSets(sets, isLoading)}
    </div>
  );
}
