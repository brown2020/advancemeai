"use client";

import { useEffect, useState } from "react";
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
import { SignInGate, SignInGateIcons } from "@/components/auth/SignInGate";

export default function QuizzesClient({
  authIsGuaranteed = false,
}: {
  authIsGuaranteed?: boolean;
}) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [quizzes, assignQuizzes] = useState<Quiz[]>([]);
  const [loading, assignLoading] = useState<boolean>(true);
  const [error, assignError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch quizzes if user is authenticated
    if (user) {
      const fetchQuizzes = async () => {
        try {
          assignLoading(true);
          const data = await getAllQuizzes();
          assignQuizzes(data);
        } catch (err) {
          assignError(
            err instanceof Error ? err.message : "Failed to fetch quizzes"
          );
        } finally {
          assignLoading(false);
        }
      };
      fetchQuizzes();
    } else {
      assignLoading(false);
    }
  }, [user]);

  // Header actions component
  const HeaderActions = (
    <ActionLink href={ROUTES.QUIZZES.CREATE}>Create New Quiz</ActionLink>
  );

  if (isAuthLoading) {
    return (
      <PageContainer>
        <PageHeader title="Quiz Library" />
        <LoadingState
          message={authIsGuaranteed ? "Loading quizzes..." : "Checking your session..."}
        />
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer>
        <PageHeader title="Quiz Library" />
        <SignInGate
          title="Sign in to access Quizzes"
          description={
            authIsGuaranteed
              ? "Your session expired. Sign in again to access your quizzes."
              : "Test your knowledge with quick quizzes to identify areas where you need more practice."
          }
          icon={SignInGateIcons.quiz}
          buttonStyle="quiz"
        />
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
              <p className="text-muted-foreground mb-2">
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

