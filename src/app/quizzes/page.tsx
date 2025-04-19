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
import Auth from "@/components/Auth";

export default function QuizzesPage() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch quizzes if user is authenticated
    if (user) {
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
    } else {
      setLoading(false);
    }
  }, [user]);

  // Header actions component
  const HeaderActions = (
    <ActionLink href={ROUTES.QUIZZES.CREATE}>Create New Quiz</ActionLink>
  );

  if (!user) {
    return (
      <PageContainer>
        <PageHeader title="Quiz Library" />

        <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white rounded-lg shadow-sm mt-8 max-w-2xl mx-auto">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="mb-6 rounded-full bg-green-50 p-6 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-green-600"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Sign in to access Quizzes
            </h2>
            <p className="text-gray-600 mb-6">
              Test your knowledge with quick quizzes to identify areas where you
              need more practice.
            </p>
            <div className="w-full max-w-sm">
              <Auth buttonStyle="quiz" />
            </div>
            <p className="mt-6 text-sm text-gray-500">
              Don&apos;t have an account? Sign up for free by clicking the
              button above.
            </p>
          </div>
        </div>
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
