"use client";

import { useEffect } from "react";
import { useFlashcardStudyStore } from "@/stores/flashcard-study-store";
import { listFlashcardStudyProgressForUser } from "@/services/flashcardStudyService";
import { logger } from "@/utils/logger";

/** Loads saved mastery for every set the signed-in user has studied. */
export function useHydrateLibraryProgress(userId: string | undefined) {
  const hydrateProgress = useFlashcardStudyStore((s) => s.hydrateProgress);

  useEffect(() => {
    if (!userId) return;
    let isMounted = true;
    listFlashcardStudyProgressForUser(userId)
      .then((rows) => {
        if (!isMounted) return;
        rows.forEach((row) => {
          hydrateProgress(userId, row.setId, row.masteryByCardId);
        });
      })
      .catch((error: unknown) => {
        logger.warn("Failed to hydrate flashcard progress", error);
      });
    return () => {
      isMounted = false;
    };
  }, [hydrateProgress, userId]);
}
