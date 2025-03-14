"use client";

import React, { useMemo, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { FlashcardSet } from "@/types/flashcard";
import { useUserFlashcards } from "@/hooks/useFlashcards";
import {
  useFlashcardSettings,
  FlashcardSettings,
} from "@/hooks/useFlashcardSettings";
import { FlashcardSetCard } from "@/components/flashcards/FlashcardSetCard";
import { LoadingSpinner } from "@/components/LoadingSpinner";

// Separate component for empty state
const EmptyState = React.memo(() => (
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
));
EmptyState.displayName = "EmptyState";

// Separate component for loading state
const LoadingState = React.memo(() => (
  <div className="flex justify-center py-12">
    <LoadingSpinner size="large" />
  </div>
));
LoadingState.displayName = "LoadingState";

// Separate component for error state
const ErrorDisplay = React.memo(({ message }: { message: string }) => (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
    {message}
  </div>
));
ErrorDisplay.displayName = "ErrorDisplay";

// Separate component for flashcard sets grid
const FlashcardSetsGrid = React.memo(({ sets }: { sets: FlashcardSet[] }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {sets.map((set) => (
      <FlashcardSetCard key={set.id} set={set} />
    ))}
  </div>
));
FlashcardSetsGrid.displayName = "FlashcardSetsGrid";

// Separate component for the header actions
const HeaderActions = React.memo(
  ({ isLoading, onRefresh }: { isLoading: boolean; onRefresh: () => void }) => (
    <div className="flex space-x-2">
      <button
        onClick={onRefresh}
        disabled={isLoading}
        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50"
        aria-label="Refresh flashcard sets"
      >
        {isLoading ? "Refreshing..." : "Refresh"}
      </button>
      <Link
        href="/flashcards/create"
        className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
      >
        Create New Set
      </Link>
    </div>
  )
);
HeaderActions.displayName = "HeaderActions";

// Sort function for flashcard sets
const sortFlashcardSets = (
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

export default function FlashcardsPage() {
  const { user } = useAuth();
  const { settings } = useFlashcardSettings();

  // Use settings for the flashcards hook
  const { sets, isLoading, error, refreshData } = useUserFlashcards({
    refreshInterval: settings.autoRefresh ? settings.refreshInterval : 0,
    prefetchSets: settings.prefetchSets,
  });

  // Memoize the sorted sets to prevent unnecessary re-renders
  const sortedSets = useMemo(() => {
    return sortFlashcardSets(
      sets,
      settings.sortBy,
      settings.sortDirection as "asc" | "desc"
    );
  }, [sets, settings.sortBy, settings.sortDirection]);

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
        <HeaderActions isLoading={isLoading} onRefresh={refreshData} />
      </div>

      {error && <ErrorDisplay message={error} />}

      {isLoading && sets.length === 0 ? (
        <LoadingState />
      ) : sortedSets.length === 0 ? (
        <EmptyState />
      ) : (
        <FlashcardSetsGrid sets={sortedSets} />
      )}
    </div>
  );
}
