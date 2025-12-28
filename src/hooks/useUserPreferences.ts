"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { UserPreferences } from "@/types/user-preferences";
import { DEFAULT_USER_PREFERENCES } from "@/types/user-preferences";
import { getUserPreferences, saveUserPreferences } from "@/services/userPreferencesService";
import { useLoadingState } from "./useLoadingState";

export function useUserPreferences(userId: string | null | undefined) {
  const [preferences, setPreferences] = useState<UserPreferences>(
    DEFAULT_USER_PREFERENCES
  );
  const [hasLoaded, setHasLoaded] = useState(false);
  const { isLoading, error, withLoading } = useLoadingState({
    initialLoading: Boolean(userId),
  });
  const isMountedRef = useRef(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const data = await withLoading(
      () => getUserPreferences(userId),
      "Failed to load preferences. Please try again."
    );
    if (!isMountedRef.current) return;
    setPreferences(data);
    setHasLoaded(true);
  }, [userId, withLoading]);

  useEffect(() => {
    isMountedRef.current = true;
    if (!userId) {
      setPreferences(DEFAULT_USER_PREFERENCES);
      setHasLoaded(false);
      return () => {
        isMountedRef.current = false;
      };
    }
    refresh().catch(() => {});
    return () => {
      isMountedRef.current = false;
    };
  }, [refresh, userId]);

  const update = useCallback((patch: Partial<UserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...patch }));
  }, []);

  const save = useCallback(async () => {
    if (!userId) return;
    await withLoading(
      () => saveUserPreferences({ userId, preferences }),
      "Failed to save preferences. Please try again."
    );
  }, [preferences, userId, withLoading]);

  return { preferences, update, save, refresh, isLoading, error, hasLoaded };
}


