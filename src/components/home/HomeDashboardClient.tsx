"use client";

import { useEffect, useState } from "react";
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
import { logger } from "@/utils/logger";

export function HomeDashboardClient() {
  const { user, userProfile, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
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

        if (!cancelled) setData(dashboardData);
      } catch (err) {
        logger.error("Client dashboard load failed:", err);
        if (!cancelled) {
          setError("Could not load your dashboard. Please refresh the page.");
        }
      } finally {
        if (!cancelled) setLoading(false);
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
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground mb-4" role="alert">
          {error ?? "Unable to load dashboard."}
        </p>
        <Link href="/" className="text-primary underline underline-offset-4">
          Refresh
        </Link>
      </div>
    );
  }

  return <HomeDashboardView displayName={displayName} data={data} />;
}

function HomeDashboardSkeleton() {
  return (
    <div className="container mx-auto px-4 py-12 space-y-8" aria-busy="true">
      <Skeleton className="h-10 w-64 rounded-xl" />
      <Skeleton className="h-5 w-96 max-w-full rounded-lg" />
      <div className="flex gap-3">
        <Skeleton className="h-10 w-40 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <Skeleton className="h-24 w-full max-w-xl rounded-xl" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
