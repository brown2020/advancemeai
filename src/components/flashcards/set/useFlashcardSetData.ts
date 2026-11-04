"use client";

import { useEffect, useRef, useState } from "react";
import type { FlashcardSet } from "@/types/flashcard";
import { getFlashcardSet } from "@/services/flashcardService";
import {
  getFlashcardStudyProgress,
  saveFlashcardStudyProgress,
} from "@/services/flashcardStudyService";
import { useFlashcardStudyStore } from "@/stores/flashcard-study-store";
import { useFlashcardLibraryStore } from "@/stores/flashcard-library-store";
import type { MasteryMap } from "@/components/flashcards/study/study-utils";

const EMPTY_MASTERY: MasteryMap = Object.freeze({});
const ANON_USER_ID = "anon";

function mergeMastery(a: MasteryMap, b: MasteryMap): MasteryMap {
  const merged: MasteryMap = { ...a };
  for (const [cardId, mastery] of Object.entries(b)) {
    const current = merged[cardId] ?? 0;
    merged[cardId] = Math.max(current, mastery) as MasteryMap[string];
  }
  return merged;
}

function isSameMastery(a: MasteryMap, b: MasteryMap) {
  const aKeys = Object.keys(a);
  if (aKeys.length !== Object.keys(b).length) return false;
  return aKeys.every((k) => a[k] === b[k]);
}

type UseFlashcardSetDataOptions = {
  setId: string;
  initialSet?: FlashcardSet;
  userId: string | null;
  /** Re-fetch the set whenever this becomes true (returning to the set page). */
  refreshWhen: boolean;
};

/**
 * Loads a flashcard set, hydrates/merges study progress from Firestore and
 * persists mastery changes (debounced) for signed-in users.
 */
export function useFlashcardSetData({
  setId,
  initialSet,
  userId,
  refreshWhen,
}: UseFlashcardSetDataOptions) {
  const progressUserId = userId ?? ANON_USER_ID;
  const progressKey = `${progressUserId}:${setId}`;

  const [set, setSet] = useState<FlashcardSet | null>(initialSet ?? null);
  const [isLoading, setIsLoading] = useState(!initialSet);
  const [error, setError] = useState<string | null>(null);

  const getProgress = useFlashcardStudyStore((s) => s.getProgress);
  const hydrateProgress = useFlashcardStudyStore((s) => s.hydrateProgress);
  const resetProgress = useFlashcardStudyStore((s) => s.resetProgress);
  const addRecentSet = useFlashcardLibraryStore((s) => s.addRecentSet);
  const masteryByCardId = useFlashcardStudyStore(
    (s) => s.progressByUserSetKey[progressKey]?.masteryByCardId ?? EMPTY_MASTERY
  );

  const hasHydratedFromServerRef = useRef(false);
  const saveDebounceRef = useRef<number | null>(null);

  // Load the set, then hydrate (and merge anonymous) progress when signed in.
  useEffect(() => {
    let cancelled = false;

    const loadErrorMessage = (err: unknown): string => {
      const message = String(err instanceof Error ? err.message : err).toLowerCase();
      const isPermissionDenied =
        message.includes("permission") || message.includes("insufficient");
      return isPermissionDenied && !userId
        ? "This set is private. Sign in to access it."
        : "Failed to load flashcard set. Please try again.";
    };

    const applyServerProgress = (progress: { masteryByCardId?: MasteryMap } | null) => {
      if (cancelled || !userId) return;
      const serverMastery = (progress?.masteryByCardId ?? EMPTY_MASTERY) as MasteryMap;
      if (Object.keys(serverMastery).length > 0) {
        hydrateProgress(userId, setId, serverMastery);
      }
      const anonMastery = getProgress(ANON_USER_ID, setId)?.masteryByCardId ?? null;
      if (!anonMastery || Object.keys(anonMastery).length === 0) return;
      const merged = mergeMastery(serverMastery, anonMastery);
      if (isSameMastery(serverMastery, merged)) return;
      hydrateProgress(userId, setId, merged);
      saveFlashcardStudyProgress({ userId, setId, masteryByCardId: merged }).catch(() => {
        // Non-blocking: local state is still correct.
      });
      resetProgress(ANON_USER_ID, setId);
    };

    const load = () => {
      if (!initialSet) {
        setIsLoading(true);
        setError(null);
      }
      const fetched = initialSet ? Promise.resolve(initialSet) : getFlashcardSet(setId);
      fetched.then(
        (flashcardSet) => {
          if (cancelled) return;
          setSet(flashcardSet);
          addRecentSet(setId);
          setIsLoading(false);
          if (!userId) {
            hasHydratedFromServerRef.current = true;
            return;
          }
          getFlashcardStudyProgress(userId, setId).then(
            (progress) => {
              if (cancelled) return;
              applyServerProgress(progress);
              hasHydratedFromServerRef.current = true;
            },
            (err: unknown) => {
              if (!cancelled) setError(loadErrorMessage(err));
              hasHydratedFromServerRef.current = true;
            }
          );
        },
        (err: unknown) => {
          if (cancelled) return;
          setError(loadErrorMessage(err));
          setIsLoading(false);
        }
      );
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [addRecentSet, getProgress, hydrateProgress, initialSet, resetProgress, setId, userId]);

  // Persist mastery to Firestore (debounced) once initial hydration is done.
  useEffect(() => {
    if (!userId || !hasHydratedFromServerRef.current) return;
    if (saveDebounceRef.current) window.clearTimeout(saveDebounceRef.current);

    saveDebounceRef.current = window.setTimeout(() => {
      saveFlashcardStudyProgress({ userId, setId, masteryByCardId }).catch(() => {
        // Non-blocking: local state still works even if save fails.
      });
    }, 750);

    return () => {
      if (saveDebounceRef.current) window.clearTimeout(saveDebounceRef.current);
    };
  }, [masteryByCardId, setId, userId]);

  // Refresh set contents when returning to the set page (e.g. after editing).
  useEffect(() => {
    if (!refreshWhen || !setId) return;
    let cancelled = false;
    getFlashcardSet(setId)
      .then((fresh) => {
        if (!cancelled) setSet(fresh);
      })
      .catch(() => {
        // Keep existing set data if refresh fails.
      });
    return () => {
      cancelled = true;
    };
  }, [refreshWhen, setId]);

  return { set, isLoading, error, masteryByCardId, progressUserId };
}
