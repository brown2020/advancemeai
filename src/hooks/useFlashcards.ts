import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { FlashcardSet } from "@/types/flashcard";
import {
  getUserFlashcardSets,
  prefetchFlashcardSet,
} from "@/services/flashcardService";
import { useLoadingState } from "./useLoadingState";

interface UseFlashcardsOptions {
  /** Force refresh on mount */
  initialRefresh?: boolean;
  /** Auto-refresh interval in milliseconds (0 to disable) */
  refreshInterval?: number;
  /** Prefetch individual flashcard sets for faster navigation */
  prefetchSets?: boolean;
}

/**
 * Custom hook for fetching and managing flashcard sets with SWR-like functionality
 */
export function useUserFlashcards({
  initialRefresh = false,
  refreshInterval = 0,
  prefetchSets = true,
}: UseFlashcardsOptions = {}) {
  const { user } = useAuth();
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const { isLoading, error, withLoading } = useLoadingState({
    initialLoading: true,
  });

  // Use refs to avoid unnecessary effect triggers
  const refreshIntervalRef = useRef(refreshInterval);
  const prefetchSetsRef = useRef(prefetchSets);
  const initialRefreshRef = useRef(initialRefresh);

  // Track if component is mounted
  const isMountedRef = useRef(true);

  // Update refs when props change
  useEffect(() => {
    refreshIntervalRef.current = refreshInterval;
    prefetchSetsRef.current = prefetchSets;
  }, [refreshInterval, prefetchSets]);

  // Function to fetch flashcard sets
  const fetchData = useCallback(
    async (skipCache = false) => {
      if (!user) return [];
      return await getUserFlashcardSets(user.uid);
    },
    [user]
  );

  // Function to prefetch individual flashcard sets
  const prefetchFlashcardSets = useCallback((flashcardSets: FlashcardSet[]) => {
    if (!prefetchSetsRef.current) return;

    // Use requestIdleCallback if available, otherwise setTimeout
    const scheduleTask =
      window.requestIdleCallback || ((cb) => setTimeout(cb, 1));

    scheduleTask(() => {
      flashcardSets.forEach((set) => {
        prefetchFlashcardSet(set.id);
      });
    });
  }, []);

  // Initial data loading
  useEffect(() => {
    if (!user) {
      setSets([]);
      return;
    }

    isMountedRef.current = true;

    const loadData = async () => {
      try {
        const data = await withLoading(
          () => fetchData(initialRefreshRef.current),
          "Failed to load your flashcard sets. Please try again."
        );

        if (isMountedRef.current) {
          setSets(data);

          // Prefetch individual sets for faster navigation
          prefetchFlashcardSets(data);
        }
      } catch (err) {
        // Error is handled by withLoading
      }
    };

    loadData();

    // Set up auto-refresh interval if enabled
    let intervalId: NodeJS.Timeout | null = null;
    if (refreshIntervalRef.current > 0) {
      intervalId = setInterval(() => {
        if (isMountedRef.current) {
          // Silent refresh (don't show loading state)
          fetchData(true)
            .then((data) => {
              if (isMountedRef.current) {
                setSets(data);
              }
            })
            .catch(() => {
              // Silently fail for background refreshes
            });
        }
      }, refreshIntervalRef.current);
    }

    return () => {
      isMountedRef.current = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [user, fetchData, withLoading, prefetchFlashcardSets]);

  // Function to manually refresh data
  const refreshData = useCallback(async () => {
    if (!user) return;

    try {
      const data = await withLoading(
        () => fetchData(true),
        "Failed to refresh your flashcard sets. Please try again."
      );

      if (isMountedRef.current) {
        setSets(data);

        // Prefetch individual sets after refresh
        prefetchFlashcardSets(data);
      }
    } catch (err) {
      // Error is handled by withLoading
    }
  }, [user, withLoading, fetchData, prefetchFlashcardSets]);

  return {
    sets,
    isLoading,
    error,
    refreshData,
    // Add a method to get a specific set by ID from the loaded sets
    getSetById: useCallback(
      (id: string) => sets.find((set) => set.id === id),
      [sets]
    ),
  };
}
