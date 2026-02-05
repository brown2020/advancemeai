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
// getLevelProgress available from "@/types/gamification" if needed

export default function ProgressPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const gamification = useGamification();
  const [loading, setLoading] = useState(true);

  // Mock data for now - in a real app, this would come from the stores/services
  const [studyData, setStudyData] = useState<Record<string, number>>({});
  const [weeklyMinutes, setWeeklyMinutes] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [masteryData, setMasteryData] = useState({
    notStarted: 0,
    learning: 0,
    familiar: 0,
    mastered: 0,
  });
  const [topicData, setTopicData] = useState<{ topic: string; correct: number; total: number }[]>([]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push("/auth/signin?redirect=/progress");
      return;
    }

    // Simulate loading data
    const loadData = async () => {
      // Generate sample study calendar data
      const calendarData: Record<string, number> = {};
      const today = new Date();
      for (let i = 0; i < 90; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split("T")[0]!;
        // Random study activity (weighted towards lower values)
        const rand = Math.random();
        if (rand > 0.3) {
          calendarData[dateStr] = rand > 0.8 ? 4 : rand > 0.6 ? 3 : rand > 0.4 ? 2 : 1;
        }
      }
      setStudyData(calendarData);

      // Generate weekly minutes based on actual study sessions
      const sessions = gamification.totalStudySessions || 0;
      const minutesPerSession = 15; // Average session length
      const today2 = new Date().getDay();
      const weekly = [0, 0, 0, 0, 0, 0, 0];
      // Distribute sessions across the week (more recent days have more)
      for (let i = 0; i < Math.min(sessions, 21); i++) {
        const dayIdx = (today2 - (i % 7) + 7) % 7;
        const currentValue = weekly[dayIdx] ?? 0;
        weekly[dayIdx] = currentValue + minutesPerSession + Math.floor(Math.random() * 10);
      }
      setWeeklyMinutes(weekly);

      // Mastery based on cards studied
      const totalCards = gamification.totalCardsStudied || 0;
      setMasteryData({
        mastered: Math.floor(totalCards * 0.3),
        familiar: Math.floor(totalCards * 0.25),
        learning: Math.floor(totalCards * 0.25),
        notStarted: Math.max(0, 100 - totalCards), // Assume 100 cards total
      });

      // Topic breakdown from questions answered
      const questions = gamification.totalQuestionsAnswered || 0;
      const correctRate = questions > 0 ? 0.6 + Math.random() * 0.3 : 0;
      setTopicData([
        { topic: "Reading Comprehension", correct: Math.floor(questions * 0.25 * correctRate), total: Math.floor(questions * 0.25) },
        { topic: "Writing & Language", correct: Math.floor(questions * 0.25 * (correctRate + 0.1)), total: Math.floor(questions * 0.25) },
        { topic: "Math (No Calculator)", correct: Math.floor(questions * 0.25 * (correctRate - 0.1)), total: Math.floor(questions * 0.25) },
        { topic: "Math (Calculator)", correct: Math.floor(questions * 0.25 * correctRate), total: Math.floor(questions * 0.25) },
      ].filter(t => t.total > 0));

      setLoading(false);
    };

    void loadData();
  }, [user, authLoading, router, gamification.totalStudySessions, gamification.totalCardsStudied, gamification.totalQuestionsAnswered]);

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
              lastStudyDate={null}
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
