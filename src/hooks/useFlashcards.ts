import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { FlashcardSet } from "@/types/flashcard";
import { getUserFlashcardSets } from "@/services/flashcardService";
import { Cache } from "@/utils/cache";

// Create a dedicated cache for flashcard sets
const flashcardCache = new Cache<string, FlashcardSet[]>({
  expirationMs: 5 * 60 * 1000, // 5 minutes
});

export function useUserFlashcards(forceRefresh = false) {
  const { user } = useAuth();
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlashcardSets = useCallback(
    async (userId: string, skipCache = false) => {
      if (skipCache) {
        // Bypass cache if skipCache is true
        const userSets = await getUserFlashcardSets(userId);
        flashcardCache.set(userId, userSets);
        return userSets;
      }

      // Use the cache's getOrSet method to handle caching logic
      return flashcardCache.getOrSet(userId, () =>
        getUserFlashcardSets(userId)
      );
    },
    []
  );

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadFlashcardSets = async () => {
      try {
        const userSets = await fetchFlashcardSets(user.uid, forceRefresh);
        if (isMounted) {
          setSets(userSets);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching flashcard sets:", err);
          setError("Failed to load your flashcard sets. Please try again.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadFlashcardSets();

    return () => {
      isMounted = false;
    };
  }, [user, fetchFlashcardSets, forceRefresh]);

  // Function to manually refresh data
  const refreshData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const userSets = await fetchFlashcardSets(user.uid, true);
      setSets(userSets);
    } catch (err) {
      console.error("Error refreshing flashcard sets:", err);
      setError("Failed to refresh your flashcard sets. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchFlashcardSets]);

  return { sets, isLoading, error, refreshData };
}
