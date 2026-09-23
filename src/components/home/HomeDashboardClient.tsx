"use client";

import { useEffect, useReducer } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { getUserFlashcardSets } from "@/services/flashcardService";
import { getGamificationData } from "@/services/gamificationService";
import { listFlashcardStudyProgressForUser } from "@/services/flashcardStudyService";
import { pickContinueStudying } from "@/lib/dashboard-continue";
import { getLevelFromXP } from "@/types/gamification";
import type { DashboardData } from "@/types/dashboard";
import { HomeDashboardView } from "./HomeDashboardView";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button-variants";
import { logger } from "@/utils/logger";

type LoadState = {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
};

export function HomeDashboardClient() {
  const { user, userProfile, isLoading: authLoading } = useAuth();
  const [state, dispatch] = useReducer(
    (prev: LoadState, patch: Partial<LoadState>): LoadState => ({ ...prev, ...patch }),
    { data: null, loading: true, error: null }
  );
  const { data, loading, error } = state;

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      dispatch({ loading: false });
      return;
    }

    let cancelled = false;

    const load = async () => {
      dispatch({ loading: true, error: null });
      try {
        const [sets, gamification, progressList] = await Promise.all([
          getUserFlashcardSets(user.uid),
          getGamificationData(user.uid).catch(() => null),
          listFlashcardStudyProgressForUser(user.uid).catch(() => []),
        ]);

        const recentSets = [...sets]
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .slice(0, 6);

        let lastFlashcard: {
          setId: string;
          title: string;
          at: number;
        } | null = null;

        if (progressList.length > 0) {
          const setById = new Map(sets.map((s) => [s.id, s]));
          for (const progress of progressList) {
            const masteryCount = Object.keys(progress.masteryByCardId).length;
            if (masteryCount === 0) continue;
            const set = setById.get(progress.setId);
            if (!set) continue;
            const at = set.updatedAt;
            if (!lastFlashcard || at >= lastFlashcard.at) {
              lastFlashcard = {
                setId: progress.setId,
                title: set.title,
                at,
              };
            }
          }
        }

        const dashboardData: DashboardData = {
          recentSets,
          continueStudying: pickContinueStudying(null, lastFlashcard),
          gamification: gamification
            ? {
                xp: gamification.xp,
                level: gamification.level ?? getLevelFromXP(gamification.xp),
                currentStreak: gamification.currentStreak,
              }
            : null,
        };

        if (!cancelled) dispatch({ data: dashboardData });
      } catch (err) {
        logger.error("Client dashboard load failed:", err);
        if (!cancelled) {
          dispatch({ error: "Could not load your dashboard. Please refresh the page." });
        }
      } finally {
        if (!cancelled) dispatch({ loading: false });
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  const displayName =
    userProfile?.displayName ||
    user?.email?.split("@")[0] ||
    "Student";

  if (authLoading || loading) {
    return <HomeDashboardSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="mb-5 text-muted-foreground" role="alert">
          {error ?? "Unable to load dashboard."}
        </p>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Refresh
        </Link>
      </div>
    );
  }

  return <HomeDashboardView displayName={displayName} data={data} />;
}

function HomeDashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 md:py-10" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-4 w-28 rounded-lg" />
        <Skeleton className="h-8 w-56 rounded-xl" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Skeleton className="h-32 w-full rounded-3xl" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {["a", "b", "c", "d"].map((id) => (
              <Skeleton key={id} className="h-28 rounded-2xl" />
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {["a", "b", "c"].map((id) => (
              <Skeleton key={id} className="h-24 rounded-2xl" />
            ))}
          </div>
        </div>
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    </div>
  );
}
