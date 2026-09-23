"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getAllQuizzes, type Quiz } from "@/services/quizService";
import {
  PageContainer,
  PageHeader,
  ErrorDisplay,
} from "@/components/common/UIComponents";
import { SignInGate, SignInGateIcons } from "@/components/auth/SignInGate";
import {
  NewQuizLink,
  QuizLibrary,
  QuizLibrarySkeleton,
} from "@/components/quizzes/QuizLibrary";
import type { QuizSummary } from "@/components/quizzes/QuizCard";

const PAGE_TITLE = "Quizzes";
const PAGE_DESCRIPTION = "Quick multiple-choice checks on what you know.";

export default function QuizzesClient({
  authIsGuaranteed = false,
}: {
  authIsGuaranteed?: boolean;
}) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.uid ?? null;
  useEffect(() => {
    let cancelled = false;
    const fetchQuizzes = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await getAllQuizzes();
        if (!cancelled) setQuizzes(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to fetch quizzes");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetchQuizzes();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const summaries = useMemo<QuizSummary[]>(
    () =>
      quizzes.map((quiz) => ({
        id: quiz.id,
        title: quiz.title || "Untitled quiz",
        questionCount: quiz.questions?.length ?? 0,
        isOwner: Boolean(userId) && quiz.userId === userId,
        isPublic: quiz.isPublic !== false,
        createdAt: quiz.createdAt,
      })),
    [quizzes, userId]
  );

  if (isAuthLoading) {
    return (
      <PageContainer>
        <PageHeader title={PAGE_TITLE} description={PAGE_DESCRIPTION} />
        <QuizLibrarySkeleton />
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer>
        <PageHeader title={PAGE_TITLE} />
        <SignInGate
          title="Sign in to access Quizzes"
          description={
            authIsGuaranteed
              ? "Your session expired. Sign in again to access your quizzes."
              : "Test your knowledge with quick quizzes to identify areas where you need more practice."
          }
          icon={SignInGateIcons.quiz}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={PAGE_TITLE}
        description={PAGE_DESCRIPTION}
        actions={<NewQuizLink />}
      />

      {error && <ErrorDisplay message={error} />}

      {loading ? (
        <QuizLibrarySkeleton />
      ) : error && summaries.length === 0 ? null : (
        <QuizLibrary quizzes={summaries} />
      )}
    </PageContainer>
  );
}
