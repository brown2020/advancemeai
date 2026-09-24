"use client";

import { useEffect, useState } from "react";
import { getLevelFromXP } from "@/types/gamification";
import { redirect } from "next/navigation";
import {
  Award,
  CalendarDays,
  CheckCircle2,
  Clock,
  Flame,
  PieChart,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useGamification } from "@/hooks/useGamification";
import { DashboardCard } from "@/components/progress/DashboardCard";
import { MasteryChart, MasteryChartSkeleton } from "@/components/progress/MasteryChart";
import { StatTile } from "@/components/progress/StatTile";
import { StreakCard, StreakCardSkeleton } from "@/components/progress/StreakCard";
import { StudyCalendar, StudyCalendarSkeleton } from "@/components/progress/StudyCalendar";
import { TopicBreakdown, TopicBreakdownSkeleton } from "@/components/progress/TopicBreakdown";
import { WeeklyProgress, WeeklyProgressSkeleton } from "@/components/progress/WeeklyProgress";
import { AchievementsGrid, AchievementProgress } from "@/components/gamification/AchievementBadge";
import { XPProgress } from "@/components/gamification/XPProgress";
import {
  ActionLink,
  ErrorDisplay,
  PageContainer,
  PageHeader,
} from "@/components/common/UIComponents";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES, signInHref } from "@/constants/appConstants";
import type { ProgressAnalyticsData } from "@/lib/progress-analytics";
import { loadUserProgressAnalytics } from "@/services/progressAnalyticsService";

const EMPTY_ANALYTICS: ProgressAnalyticsData = {
  studyData: {},
  weeklyMinutes: [0, 0, 0, 0, 0, 0, 0],
  masteryData: { notStarted: 0, learning: 0, familiar: 0, mastered: 0 },
  topicData: [],
  hasActivity: false,
};

function practiceAccuracy(topics: ProgressAnalyticsData["topicData"]) {
  const totals = topics.reduce(
    (acc, t) => ({ correct: acc.correct + t.correct, total: acc.total + t.total }),
    { correct: 0, total: 0 }
  );
  return {
    ...totals,
    percent: totals.total > 0 ? Math.round((totals.correct / totals.total) * 100) : null,
  };
}

export default function ProgressPageClient() {
  const { user, isLoading: authLoading } = useAuth();
  const gamification = useGamification();
  const [analytics, setAnalytics] = useState<ProgressAnalyticsData>(EMPTY_ANALYTICS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await loadUserProgressAnalytics(user.uid);
        if (!cancelled) setAnalytics(data);
      } catch {
        if (cancelled) return;
        setLoadError("Could not load progress data. Please try again.");
        setAnalytics(EMPTY_ANALYTICS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  if (!authLoading && !user) {
    redirect(signInHref("/progress"));
  }

  if (authLoading) {
    return (
      <PageContainer>
        <PageHeader title="Your progress" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4" aria-busy="true">
          <span className="sr-only">Loading progress…</span>
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </PageContainer>
    );
  }

  const { studyData, weeklyMinutes, masteryData, topicData, hasActivity } = analytics;
  const accuracy = practiceAccuracy(topicData);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Progress"
        title="Your progress"
        description="XP, streaks, mastery, and practice accuracy — all in one place."
        actions={
          <ActionLink href={ROUTES.FLASHCARDS.INDEX} variant="secondary">
            Keep studying
          </ActionLink>
        }
      />

      {loadError && <ErrorDisplay message={loadError} />}

      {!loading && !loadError && !hasActivity && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-primary/20 bg-accent px-4 py-3 text-sm text-accent-foreground">
          <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            Start practicing SAT sections or studying flashcards to see your progress here.
          </p>
        </div>
      )}

      {/* Headline stats */}
      <section aria-label="Summary" className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          label="Level"
          icon={TrendingUp}
          value={getLevelFromXP(gamification.xp)}
          hint={`${gamification.xp.toLocaleString()} XP total`}
        >
          <XPProgress xp={gamification.xp} size="sm" showDetails={false} />
        </StatTile>
        <StatTile
          label="Streak"
          icon={Flame}
          tone="streak"
          value={
            <span className={gamification.currentStreak > 0 ? "text-streak" : undefined}>
              {gamification.currentStreak}
              <span className="ml-1 text-base font-medium text-muted-foreground">
                {gamification.currentStreak === 1 ? "day" : "days"}
              </span>
            </span>
          }
          hint={`Best: ${gamification.longestStreak} ${gamification.longestStreak === 1 ? "day" : "days"}`}
        />
        <StatTile
          label="Cards mastered"
          icon={CheckCircle2}
          tone="success"
          value={masteryData.mastered}
          isLoading={loading}
          hint={`${gamification.totalCardsStudied.toLocaleString()} cards studied`}
        />
        <StatTile
          label="Practice accuracy"
          icon={Target}
          value={accuracy.percent === null ? "—" : `${accuracy.percent}%`}
          isLoading={loading}
          hint={
            accuracy.total > 0
              ? `${accuracy.correct}/${accuracy.total} correct`
              : `${gamification.totalQuestionsAnswered.toLocaleString()} questions answered`
          }
        />
      </section>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        {loading ? (
          <StreakCardSkeleton />
        ) : (
          <StreakCard
            currentStreak={gamification.currentStreak}
            longestStreak={gamification.longestStreak}
            lastStudyDate={gamification.lastStudyDate}
          />
        )}
        <DashboardCard
          title="Last 7 days"
          description="Minutes studied per day"
          icon={<Clock aria-hidden />}
          className="lg:col-span-2"
        >
          {loading ? (
            <WeeklyProgressSkeleton />
          ) : (
            <WeeklyProgress weeklyMinutes={weeklyMinutes} />
          )}
        </DashboardCard>
      </div>

      <DashboardCard
        title="Study activity"
        description="Your last 6 months"
        icon={<CalendarDays aria-hidden />}
        className="mb-6"
      >
        {loading ? <StudyCalendarSkeleton /> : <StudyCalendar studyData={studyData} weeks={26} />}
      </DashboardCard>

      <div className="mb-6 grid gap-6 md:grid-cols-2">
        <DashboardCard
          title="Card mastery"
          description="Across all your flashcard sets"
          icon={<PieChart aria-hidden />}
        >
          {loading ? <MasteryChartSkeleton /> : <MasteryChart data={masteryData} />}
        </DashboardCard>
        <DashboardCard
          title="Performance by topic"
          description="SAT practice accuracy, weakest first"
          icon={<Target aria-hidden />}
        >
          {loading ? <TopicBreakdownSkeleton /> : <TopicBreakdown topics={topicData} />}
        </DashboardCard>
      </div>

      <DashboardCard
        title="Achievements"
        description="Earn badges (and bonus XP) as you study"
        icon={<Award aria-hidden />}
      >
        <AchievementProgress
          unlockedCount={gamification.achievements.length}
          className="mb-6 max-w-md"
        />
        <AchievementsGrid
          unlockedIds={gamification.achievements}
          achievementDates={gamification.achievementDates}
          size="sm"
          showLocked
        />
      </DashboardCard>
    </PageContainer>
  );
}
