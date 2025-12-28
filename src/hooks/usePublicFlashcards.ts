import { useCallback, useEffect, useRef, useState } from "react";
import type { FlashcardSet } from "@/types/flashcard";
import { getPublicFlashcardSets } from "@/services/flashcardService";
import { useLoadingState } from "./useLoadingState";

export function usePublicFlashcards() {
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const { isLoading, error, withLoading } = useLoadingState({ initialLoading: true });
  const isMountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    return await getPublicFlashcardSets();
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    withLoading(fetchData, "Failed to load public flashcard sets. Please try again.")
      .then((data) => {
        if (!isMountedRef.current) return;
        setSets(data);
      })
      .catch(() => {});

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData, withLoading]);

  const refresh = useCallback(async () => {
    try {
      const data = await withLoading(
        fetchData,
        "Failed to refresh public flashcard sets. Please try again."
      );
      if (isMountedRef.current) setSets(data);
    } catch {
      // handled by withLoading
    }
  }, [fetchData, withLoading]);

  return { sets, isLoading, error, refresh };
}


