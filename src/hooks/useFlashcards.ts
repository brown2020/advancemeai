import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { FlashcardSet } from "@/types/flashcard";
import { getUserFlashcardSets } from "@/services/flashcardService";

export function useUserFlashcards() {
  const { user } = useAuth();
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchFlashcardSets = async () => {
      try {
        const userSets = await getUserFlashcardSets(user.uid);
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

    fetchFlashcardSets();

    return () => {
      isMounted = false;
    };
  }, [user]);

  return { sets, isLoading, error };
}
