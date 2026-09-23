"use client";

import { useEffect, useState, useReducer} from "react";
import { Button } from "@/components/ui/button";
import {
  ErrorDisplay,
  LoadingState,
  PageContainer,
  PageHeader,
  SectionContainer,
  ActionLink,
} from "@/components/common/UIComponents";
import { cn } from "@/utils/cn";
import { useAuth } from "@/lib/auth";
import { SignInGate, SignInGateIcons } from "@/components/auth/SignInGate";

type Quiz = {
  id: string;
  title: string;
  questions: {
    text: string;
    options: string[];
    correctAnswer: string;
  }[];
};

export default function QuizDetailClient({
  quizId,
  authIsGuaranteed = false,
  initialQuiz,
}: {
  quizId: string;
  authIsGuaranteed?: boolean;
  initialQuiz?: Quiz;
}) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [state, dispatch] = useReducer(
    (s: any, p: Record<string, any>): any => {
      const patch: Record<string, any> = {};
      for (const key of Object.keys(p)) {
        const value = p[key];
        patch[key] = typeof value === "function" ? value(s[key]) : value;
      }
      return { ...s, ...patch };
    },
    {
    quiz: initialQuiz ?? null,
    selectedAnswers: {},
    isSubmitting: false,
    quizCompleted: false,
    error: null,
    score: null,
    }
  );
  const { quiz, selectedAnswers, isSubmitting, quizCompleted, error, score } = state as any;
  const assignQuiz = (value: any) => dispatch({ quiz: value });
  const assignSelectedAnswers = (value: any) => dispatch({ selectedAnswers: value });
  const assignIsSubmitting = (value: any) => dispatch({ isSubmitting: value });
  const assignQuizCompleted = (value: any) => dispatch({ quizCompleted: value });
  const assignError = (value: any) => dispatch({ error: value });
  const assignScore = (value: any) => dispatch({ score: value });


  useEffect(() => {
    if (initialQuiz) {
      assignQuiz(initialQuiz);
      assignError(null);
      return;
    }
    if (quizId) {
      assignError("Unable to load this quiz. Please sign in and try again.");
    }
  }, [initialQuiz, quizId]);

  const handleSelectAnswer = (questionIndex: number, answer: string) => {
    assignSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }));
  };

  const handleSubmit = () => {
    if (!quiz) return;

    assignIsSubmitting(true);

    let correctCount = 0;
    quiz.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correctCount++;
      }
    });

    setTimeout(() => {
      assignIsSubmitting(false);
      assignScore({
        correct: correctCount,
        total: quiz.questions.length,
      });
      assignQuizCompleted(true);
    }, 1000);
  };

  if (isAuthLoading) {
    return (
      <PageContainer className="max-w-4xl">
        <PageHeader title="Quiz" />
        <LoadingState
          message={authIsGuaranteed ? "Loading quiz..." : "Checking your session..."}
        />
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer className="max-w-4xl">
        <PageHeader title="Quiz" />
        <SignInGate
          title="Sign in to access Quizzes"
          description={
            authIsGuaranteed
              ? "Your session expired. Sign in again to take this quiz."
              : "Sign in to take quizzes and track your progress."
          }
          icon={SignInGateIcons.quiz}
        />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer className="max-w-4xl">
        <PageHeader title="Quiz" />
        <ErrorDisplay message={error} />
        <ActionLink href="/quizzes" variant="secondary" className="mt-4">
          Back to Quizzes
        </ActionLink>
      </PageContainer>
    );
  }

  if (!quiz) {
    return (
      <PageContainer className="max-w-4xl">
        <PageHeader title="Quiz" />
        <LoadingState message="Loading quiz..." />
      </PageContainer>
    );
  }

  if (quizCompleted) {
    return (
      <PageContainer className="max-w-4xl">
        <PageHeader title="Quiz Completed" />
        {score && (
          <SectionContainer>
            <p className="text-xl font-medium">
              Your Score: {score.correct} out of {score.total}
            </p>
            <p className="text-muted-foreground mt-2">
              {score.correct === score.total
                ? "Perfect score! Excellent work!"
                : score.correct >= score.total * 0.7
                  ? "Great job!"
                  : "Keep practicing!"}
            </p>
          </SectionContainer>
        )}
        <div className="mt-4">
          <ActionLink href="/quizzes" variant="secondary">
            Back to Quizzes
          </ActionLink>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="max-w-4xl">
      <div className="mb-6">
        <ActionLink href="/quizzes" variant="secondary">
          ← Back to Quizzes
        </ActionLink>
      </div>

      <PageHeader title={quiz.title} />

      <div className="space-y-6">
        {quiz.questions.map((question, rowNo) => (
          <SectionContainer key={rowNo} title={`Question ${rowNo + 1}`}>
            <p className="text-base font-medium mb-4">{question.text}</p>
            <div className="space-y-2">
              {question.options.map((option, optIdx) => (
                <button
                  key={optIdx}
                  onClick={() => handleSelectAnswer(rowNo, option)}
                  className={cn(
                    "w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    selectedAnswers[rowNo] === option
                      ? "border-ring bg-accent"
                      : "border-border bg-background hover:bg-muted/50"
                  )}
                  type="button"
                >
                  {option}
                </button>
              ))}
            </div>
          </SectionContainer>
        ))}

        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            isLoading={isSubmitting}
            variant="default"
          >
            {isSubmitting ? "Submitting..." : "Submit Quiz"}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}

