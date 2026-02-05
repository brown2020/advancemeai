"use client";

import { useGamificationStore } from "@/stores/gamification-store";
import { AchievementToastContainer } from "./AchievementToast";

/**
 * Provider component that handles gamification toast notifications
 * Place this in your root layout to enable achievement toasts
 */
export function GamificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pendingAchievements = useGamificationStore(
    (state) => state.pendingAchievements
  );
  const clearPendingAchievements = useGamificationStore(
    (state) => state.clearPendingAchievements
  );

  return (
    <>
      {children}
      <AchievementToastContainer
        achievements={pendingAchievements}
        onClear={clearPendingAchievements}
      />
    </>
  );
}
