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
import Auth from "@/components/Auth";

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

        <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white rounded-lg shadow-sm mt-8 max-w-2xl mx-auto">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="mb-6 rounded-full bg-purple-50 p-6 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-purple-600"
              >
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Sign in to access Flashcards
            </h2>
            <p className="text-gray-600 mb-6">
              Create and study with interactive flashcards to boost your memory
              and understanding of any subject.
            </p>
            <div className="w-full max-w-sm">
              <Auth buttonStyle="flashcard" />
            </div>
            <p className="mt-6 text-sm text-gray-500">
              Don&apos;t have an account? Sign up for free by clicking the
              button above.
            </p>
          </div>
        </div>
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
