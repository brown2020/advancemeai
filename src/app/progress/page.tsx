"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function ProgressPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const gamification = useGamification();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [studyData, setStudyData] = useState<Record<string, number>>({});
  const [weeklyMinutes, setWeeklyMinutes] = useState<number[]>([
    0, 0, 0, 0, 0, 0, 0,
  ]);
  const [masteryData, setMasteryData] =
    useState<MasteryBreakdown>(EMPTY_MASTERY);
  const [topicData, setTopicData] = useState<
    { topic: string; correct: number; total: number }[]
  >([]);
  const [hasActivity, setHasActivity] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/auth/signin?returnTo=/progress");
      return;
    }

    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const analytics = await loadUserProgressAnalytics(user.uid);
        if (cancelled) return;

        setStudyData(analytics.studyData);
        setWeeklyMinutes(analytics.weeklyMinutes);
        setMasteryData(analytics.masteryData);
        setTopicData(analytics.topicData);
        setHasActivity(analytics.hasActivity);
      } catch {
        if (cancelled) return;
        setLoadError("Could not load progress data. Please try again.");
        setStudyData({});
        setWeeklyMinutes([0, 0, 0, 0, 0, 0, 0]);
        setMasteryData(EMPTY_MASTERY);
        setTopicData([]);
        setHasActivity(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router]);

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
