"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { getAllQuizzes, Quiz } from "@/services/quizService";
import { ROUTES } from "@/constants/appConstants";
import {
  PageContainer,
  PageHeader,
  LoadingState,
  ErrorDisplay,
  EmptyState,
  CardGrid,
  ActionLink,
  SectionContainer,
} from "@/components/common/UIComponents";

export default function QuizzesPage() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        const data = await getAllQuizzes();
        setQuizzes(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch quizzes"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  // Header actions component
  const HeaderActions = (
    <ActionLink href={ROUTES.QUIZZES.CREATE}>Create New Quiz</ActionLink>
  );

  if (!user) {
    return (
      <PageContainer>
        <PageHeader title="Quiz Library" />
        <p>Please sign in to view and create quizzes.</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Quiz Library" actions={HeaderActions} />

      {error && <ErrorDisplay message={error} />}

      {loading ? (
        <LoadingState message="Loading quizzes..." />
      ) : quizzes.length === 0 ? (
        <EmptyState
          title="No quizzes available"
          message="Create your first quiz to start testing your knowledge!"
          actionLink={ROUTES.QUIZZES.CREATE}
          actionText="Create New Quiz"
        />
      ) : (
        <CardGrid>
          {quizzes.map((quiz) => (
            <SectionContainer key={quiz.id}>
              <h2 className="text-lg font-bold mb-2">{quiz.title}</h2>
              <p className="text-gray-600 mb-2">
                Questions: {quiz.questions.length}
              </p>
              <div className="mt-4">
                <ActionLink
                  href={ROUTES.QUIZZES.QUIZ(quiz.id)}
                  variant="primary"
                >
                  Take Quiz
                </ActionLink>
              </div>
            </SectionContainer>
          ))}
        </CardGrid>
      )}
    </PageContainer>
  );
}
