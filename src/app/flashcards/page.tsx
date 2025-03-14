"use client";

import React, { useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { useUserFlashcards } from "@/hooks/useFlashcards";
import { useFlashcardSettings } from "@/hooks/useFlashcardSettings";
import { sortFlashcardSets } from "@/utils/flashcardUtils";
import {
  EmptyFlashcardState,
  LoadingState,
  ErrorDisplay,
  FlashcardSetsGrid,
  FlashcardHeaderActions,
  UnauthorizedState,
} from "@/components/flashcards/FlashcardComponents";

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
    return <UnauthorizedState title="Flashcards" />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Flashcard Sets</h1>
        <FlashcardHeaderActions isLoading={isLoading} onRefresh={refreshData} />
      </div>

      {error && <ErrorDisplay message={error} />}

      {isLoading && sets.length === 0 ? (
        <LoadingState />
      ) : sortedSets.length === 0 ? (
        <EmptyFlashcardState />
      ) : (
        <FlashcardSetsGrid sets={sortedSets} />
      )}
    </div>
  );
}
