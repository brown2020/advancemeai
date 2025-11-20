import { useEffect, useState } from "react";
import {
  AdaptiveRecommendation,
  getAdaptiveRecommendation,
} from "@/services/adaptivePracticeService";

export function useAdaptivePractice(
  userId: string | undefined,
  sectionId: string | undefined
) {
  const [recommendation, setRecommendation] =
    useState<AdaptiveRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId || !sectionId) return;
    setIsLoading(true);
    getAdaptiveRecommendation(userId, sectionId)
      .then(setRecommendation)
      .finally(() => setIsLoading(false));
  }, [userId, sectionId]);

  return { recommendation, isLoading };
}

