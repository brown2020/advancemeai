"use client";

import { useEffect, useReducer } from "react";
import { useRouter, redirect} from "next/navigation";
import { TrendingUp, Award, BookOpen, Target } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useGamification } from "@/hooks/useGamification";
import {
  StudyCalendar,
  StudyCalendarSkeleton,
  MasteryChart,
  MasteryChartSkeleton,
  WeeklyProgress,
  WeeklyProgressSkeleton,
  StreakCard,
  StreakCardSkeleton,
  TopicBreakdown,
  TopicBreakdownSkeleton,
} from "@/components/progress";
import { AchievementsGrid, AchievementProgress } from "@/components/gamification";
import { XPBadge } from "@/components/gamification/XPProgress";
import type { MasteryBreakdown } from "@/lib/progress-analytics";
import { loadUserProgressAnalytics } from "@/services/progressAnalyticsService";

const EMPTY_MASTERY: MasteryBreakdown = {
  notStarted: 0,
  learning: 0,
  familiar: 0,
  mastered: 0,
};

export default function ProgressPageClient() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const gamification = useGamification();
  const [state, dispatch] = useReducer((s: any, p: Record<string, any>): any => { const patch: Record<string, any> = {}; for (const key of Object.keys(p)) { const value = p[key]; patch[key] = typeof value === "function" ? value(s[key]) : value; } return { ...s, ...patch }; }, { loading: true, loadError: null as string | null, studyData: {} as Record<string, number>, weeklyMinutes: [0,0,0,0,0,0,0] as number[], masteryData: EMPTY_MASTERY as MasteryBreakdown, topicData: [] as { topic: string; correct: number; total: number }[], hasActivity: false });
  const { loading, loadError, studyData, weeklyMinutes, masteryData, topicData, hasActivity } = state as any;
  const assignLoading = (value: any | ((prev: any) => any)) => dispatch({ loading: value });
  const assignLoadError = (value: any | ((prev: any) => any)) => dispatch({ loadError: value });
  const assignStudyData = (value: any | ((prev: any) => any)) => dispatch({ studyData: value });
  const assignWeeklyMinutes = (value: any | ((prev: any) => any)) => dispatch({ weeklyMinutes: value });
  const assignMasteryData = (value: any | ((prev: any) => any)) => dispatch({ masteryData: value });
  const assignTopicData = (value: any | ((prev: any) => any)) => dispatch({ topicData: value });
  const assignHasActivity = (value: any | ((prev: any) => any)) => dispatch({ hasActivity: value });

  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;

    const loadData = async () => {
      assignLoading(true);
      assignLoadError(null);

      try {
        const analytics = await loadUserProgressAnalytics(user.uid);
        if (cancelled) return;

        dispatch({ studyData: analytics.studyData, weeklyMinutes: analytics.weeklyMinutes, masteryData: analytics.masteryData, topicData: analytics.topicData, hasActivity: analytics.hasActivity });
      } catch {
        if (cancelled) return;
        dispatch({ loadError: "Could not load progress data. Please try again.", studyData: {}, weeklyMinutes: [0,0,0,0,0,0,0], masteryData: EMPTY_MASTERY, topicData: [], hasActivity: false });
      } finally {
        if (!cancelled) assignLoading(false);
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router]);

  if (!authLoading && !user) {
    redirect("/auth/signin?returnTo=/progress");
  }

  if (authLoading || (!user && loading)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Progress Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Track your study progress and achievements
        </p>
      </div>

      {loadError ? (
        <div
          className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {loadError}
        </div>
      ) : null}

      {!loading && !loadError && !hasActivity ? (
        <div className="mb-6 rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Start practicing SAT sections or studying flashcards to see your
          progress here.
        </div>
      ) : null}

      {/* Stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp size={16} />
            <span className="text-sm">Level</span>
          </div>
          <p className="text-2xl font-bold">{gamification.level}</p>
          <div className="mt-2">
            <XPBadge xp={gamification.xp} level={gamification.level} />
          </div>
        </div>

        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Award size={16} />
            <span className="text-sm">Achievements</span>
          </div>
          <p className="text-2xl font-bold">{gamification.achievements.length}</p>
          <p className="text-sm text-muted-foreground mt-1">unlocked</p>
        </div>

        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <BookOpen size={16} />
            <span className="text-sm">Cards Studied</span>
          </div>
          <p className="text-2xl font-bold">{gamification.totalCardsStudied}</p>
          <p className="text-sm text-muted-foreground mt-1">flashcards</p>
        </div>

        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Target size={16} />
            <span className="text-sm">Questions</span>
          </div>
          <p className="text-2xl font-bold">{gamification.totalQuestionsAnswered}</p>
          <p className="text-sm text-muted-foreground mt-1">answered</p>
        </div>
      </div>

      {/* Main content */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Streak card */}
          {loading ? (
            <StreakCardSkeleton />
          ) : (
            <StreakCard
              currentStreak={gamification.currentStreak}
              longestStreak={gamification.longestStreak}
              lastStudyDate={gamification.lastStudyDate}
            />
          )}

          {/* Study calendar */}
          <div className="p-4 rounded-lg border bg-card">
            <h3 className="font-semibold mb-4">Study Activity</h3>
            {loading ? (
              <StudyCalendarSkeleton />
            ) : (
              <StudyCalendar studyData={studyData} />
            )}
          </div>

          {/* Weekly progress */}
          <div className="p-4 rounded-lg border bg-card">
            <h3 className="font-semibold mb-4">This Week</h3>
            {loading ? (
              <WeeklyProgressSkeleton />
            ) : (
              <WeeklyProgress weeklyMinutes={weeklyMinutes} />
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Mastery chart */}
          <div className="p-4 rounded-lg border bg-card">
            <h3 className="font-semibold mb-4">Card Mastery</h3>
            {loading ? (
              <MasteryChartSkeleton />
            ) : (
              <MasteryChart data={masteryData} />
            )}
          </div>

          {/* Topic breakdown */}
          <div className="p-4 rounded-lg border bg-card">
            <h3 className="font-semibold mb-4">Performance by Topic</h3>
            {loading ? (
              <TopicBreakdownSkeleton />
            ) : (
              <TopicBreakdown topics={topicData} />
            )}
          </div>

          {/* Achievements */}
          <div className="p-4 rounded-lg border bg-card">
            <h3 className="font-semibold mb-4">Achievements</h3>
            <AchievementProgress
              unlockedCount={gamification.achievements.length}
              className="mb-4"
            />
            <AchievementsGrid
              unlockedIds={gamification.achievements}
              achievementDates={gamification.achievementDates}
              size="sm"
              showLocked={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
