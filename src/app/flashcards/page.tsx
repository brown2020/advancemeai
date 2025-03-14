"use client";

import React, { useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { useUserFlashcards } from "@/hooks/useFlashcards";
import { useFlashcardSettings } from "@/hooks/useFlashcardSettings";
import { sortFlashcardSets } from "@/utils/flashcardUtils";
import { ROUTES } from "@/constants/appConstants";
import {
  PageContainer,
  PageHeader,
  LoadingState,
  ErrorDisplay,
  EmptyState,
  CardGrid,
  ActionLink,
} from "@/components/common/UIComponents";
import { FlashcardSetCard } from "@/components/flashcards/FlashcardSetCard";

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
      <PageContainer>
        <PageHeader title="Flashcards" />
        <p>Please sign in to view your flashcard sets.</p>
      </PageContainer>
    );
  }

  // Header actions component
  const HeaderActions = (
    <>
      <button
        onClick={refreshData}
        disabled={isLoading}
        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50"
        aria-label="Refresh flashcard sets"
      >
        {isLoading ? "Refreshing..." : "Refresh"}
      </button>
      <ActionLink href={ROUTES.FLASHCARDS.CREATE}>Create New Set</ActionLink>
    </>
  );

  return (
    <PageContainer>
      <PageHeader title="Your Flashcard Sets" actions={HeaderActions} />

      {error && <ErrorDisplay message={error} />}

      {isLoading && sets.length === 0 ? (
        <LoadingState message="Loading your flashcard sets..." />
      ) : sortedSets.length === 0 ? (
        <EmptyState
          title="No flashcard sets yet"
          message="Create your first set to start studying!"
          actionLink={ROUTES.FLASHCARDS.CREATE}
          actionText="Create New Set"
        />
      ) : (
        <CardGrid>
          {sortedSets.map((set) => (
            <FlashcardSetCard key={set.id} set={set} />
          ))}
        </CardGrid>
      )}
    </PageContainer>
  );
}
