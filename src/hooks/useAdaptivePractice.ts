import { useEffect, useState, useCallback } from "react";
import {
  AdaptiveRecommendation,
  getAdaptiveRecommendation,
} from "@/services/adaptivePracticeService";
import { useLoadingState } from "./useLoadingState";

export function useAdaptivePractice(
  userId: string | undefined,
  sectionId: string | undefined
) {
  const [recommendation, setRecommendation] =
    useState<AdaptiveRecommendation | null>(null);
  const { isLoading, withLoading } = useLoadingState();

  const fetchRecommendation = useCallback(async () => {
    if (!userId || !sectionId) return;

    const rec = await withLoading(
      () => getAdaptiveRecommendation(userId, sectionId),
      "Failed to load adaptive recommendation"
    );
    setRecommendation(rec);
  }, [userId, sectionId, withLoading]);

  useEffect(() => {
    fetchRecommendation();
  }, [fetchRecommendation]);

  return { recommendation, isLoading };
}
