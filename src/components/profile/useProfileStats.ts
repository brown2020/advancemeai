"use client";

import { useEffect, useMemo } from "react";
import { useUserFlashcards } from "@/hooks/useFlashcards";
import { useFlashcardFolders } from "@/hooks/useFlashcardFolders";
import { useFlashcardStudyStore } from "@/stores/flashcard-study-store";
import { listFlashcardStudyProgressForUser } from "@/services/flashcardStudyService";

export type ProfileStats = {
  /** null while loading */
  setCount: number | null;
  /** null while loading */
  folderCount: number | null;
  masteredTermsCount: number;
  starredTermsCount: number;
};

/** Library counts shown on the profile page. Hydrates study progress for the user. */
export function useProfileStats(userId: string | null): ProfileStats {
  const { sets, isLoading: isSetsLoading } = useUserFlashcards({
    refreshInterval: 0,
    prefetchSets: false,
  });
  const { folders, isLoading: isFoldersLoading } = useFlashcardFolders(userId);

  const hydrateProgress = useFlashcardStudyStore((s) => s.hydrateProgress);
  const starredBySetId = useFlashcardStudyStore((s) => s.starredBySetId);
  const progressByUserSetKey = useFlashcardStudyStore(
    (s) => s.progressByUserSetKey
  );

  useEffect(() => {
    if (!userId) return;
    let isMounted = true;
    listFlashcardStudyProgressForUser(userId)
      .then((rows) => {
        if (!isMounted) return;
        rows.forEach((row) =>
          hydrateProgress(userId, row.setId, row.masteryByCardId)
        );
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [hydrateProgress, userId]);

  return useMemo(() => {
    if (!userId) {
      return { setCount: 0, folderCount: 0, masteredTermsCount: 0, starredTermsCount: 0 };
    }

    const starredTermsCount = Object.values(starredBySetId).reduce(
      (sum, byCardId) => sum + Object.keys(byCardId ?? {}).length,
      0
    );

    const prefix = `${userId}:`;
    const masteredTermsCount = Object.entries(progressByUserSetKey)
      .filter(([key]) => key.startsWith(prefix))
      .reduce((sum, [, value]) => {
        const mastery = value?.masteryByCardId ?? {};
        return sum + Object.values(mastery).filter((m) => m === 3).length;
      }, 0);

    return {
      setCount: isSetsLoading ? null : sets.length,
      folderCount: isFoldersLoading ? null : folders.length,
      masteredTermsCount,
      starredTermsCount,
    };
  }, [
    folders.length,
    isFoldersLoading,
    isSetsLoading,
    progressByUserSetKey,
    sets.length,
    starredBySetId,
    userId,
  ]);
}
