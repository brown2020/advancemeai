import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { FlashcardSet } from "@/types/flashcard";
import { getUserFlashcardSets } from "@/services/flashcardService";
import { useLoadingState } from "./useLoadingState";

export function useUserFlashcards(forceRefresh = false) {
  const { user } = useAuth();
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const { isLoading, error, withLoading } = useLoadingState({
    initialLoading: true,
  });

  // Function to fetch flashcard sets
  const fetchData = useCallback(async () => {
    if (!user) return [];
    return await getUserFlashcardSets(user.uid);
  }, [user]);

  // Initial data loading
  useEffect(() => {
    if (!user) {
      setSets([]);
      return;
    }

    let isMounted = true;

    const loadData = async () => {
      try {
        const data = await withLoading(
          () => fetchData(),
          "Failed to load your flashcard sets. Please try again."
        );

        if (isMounted) {
          setSets(data);
        }
      } catch (err) {
        // Error is handled by withLoading
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user, fetchData, withLoading, forceRefresh]);

  // Function to manually refresh data
  const refreshData = useCallback(async () => {
    if (!user) return;

    try {
      const data = await withLoading(
        () => getUserFlashcardSets(user.uid),
        "Failed to refresh your flashcard sets. Please try again."
      );
      setSets(data);
    } catch (err) {
      // Error is handled by withLoading
    }
  }, [user, withLoading]);

  return { sets, isLoading, error, refreshData };
}
