import React from "react";
import Link from "next/link";
import { FlashcardSet } from "@/types/flashcard";
import {
  LoadingState,
  ErrorDisplay,
  EmptyState,
} from "@/components/common/UIComponents";

// Re-export from UIComponents for backward compatibility
export { LoadingState, ErrorDisplay };

// Flashcard-specific empty state with custom messaging
export const EmptyFlashcardState = React.memo(() => (
  <EmptyState
    title="No flashcard sets yet"
    message="Create your first set to start studying!"
    actionLink="/flashcards/create"
    actionText="Create New Set"
  />
));
EmptyFlashcardState.displayName = "EmptyFlashcardState";

// Common flashcard sets grid component
export const FlashcardSetsGrid = React.memo(
  ({ sets }: { sets: FlashcardSet[] }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sets.map((set) => (
        <FlashcardSetCard key={set.id} set={set} />
      ))}
    </div>
  )
);
FlashcardSetsGrid.displayName = "FlashcardSetsGrid";

// Common header actions component for flashcard pages
export const FlashcardHeaderActions = React.memo(
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
FlashcardHeaderActions.displayName = "FlashcardHeaderActions";

// Common unauthorized state component
export const UnauthorizedState = React.memo(({ title }: { title: string }) => (
  <div className="container mx-auto px-4 py-8">
    <h1 className="text-2xl font-bold mb-4">{title}</h1>
    <p>Please sign in to view your flashcard sets.</p>
  </div>
));
UnauthorizedState.displayName = "UnauthorizedState";

// Import the FlashcardSetCard to avoid circular dependencies
import { FlashcardSetCard } from "@/components/flashcards/FlashcardSetCard";
