import { useCallback, useEffect, useRef, useState } from "react";
import type { FlashcardSet } from "@/types/flashcard";
import { getPublicFlashcardSets } from "@/services/flashcardService";
import { useLoadingState } from "./useLoadingState";

export function usePublicFlashcards(options?: { initialSets?: FlashcardSet[] }) {
  const hasInitial = options?.initialSets !== undefined;
  const [sets, setSets] = useState<FlashcardSet[]>(options?.initialSets ?? []);
  const { isLoading, error, withLoading, stopLoading } = useLoadingState({
    initialLoading: !hasInitial,
  });
  const isMountedRef = useRef(true);
  const usedInitialRef = useRef(false);

  const fetchData = useCallback(async () => {
    return await getPublicFlashcardSets();
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    if (hasInitial && !usedInitialRef.current) {
      usedInitialRef.current = true;
      stopLoading(null);
      return () => {
        isMountedRef.current = false;
      };
    }

    withLoading(fetchData, "Failed to load public flashcard sets. Please try again.")
      .then((data) => {
        if (!isMountedRef.current) return;
        setSets(data);
      })
      .catch(() => {});

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchData, hasInitial, stopLoading, withLoading]);

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


