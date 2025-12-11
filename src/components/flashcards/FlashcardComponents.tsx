import React from "react";
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
