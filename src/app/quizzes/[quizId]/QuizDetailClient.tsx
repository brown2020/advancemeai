"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const [quiz, setQuiz] = useState<Quiz | null>(initialQuiz ?? null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState<{ correct: number; total: number } | null>(
    null
  );

  const router = useRouter();

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        if (initialQuiz) {
          setQuiz(initialQuiz);
          return;
        }
        const response = await fetch("/api/getquiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quizId }),
        });
        if (!response.ok) {
          throw new Error("Failed to fetch quiz");
        }
        const data = await response.json();
        setQuiz(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error");
      }
    };

    if (quizId) {
      fetchQuiz();
    }
  }, [initialQuiz, quizId]);

  const handleSelectAnswer = (questionIndex: number, answer: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }));
  };

  const handleSubmit = () => {
    if (!quiz) return;

    setIsSubmitting(true);

    let correctCount = 0;
    quiz.questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correctCount++;
      }
    });

    setTimeout(() => {
      setIsSubmitting(false);
      setScore({
        correct: correctCount,
        total: quiz.questions.length,
      });
      setQuizCompleted(true);
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
          buttonStyle="quiz"
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
        {quiz.questions.map((question, idx) => (
          <SectionContainer key={idx} title={`Question ${idx + 1}`}>
            <p className="text-base font-medium mb-4">{question.text}</p>
            <div className="space-y-2">
              {question.options.map((option, optIdx) => (
                <button
                  key={optIdx}
                  onClick={() => handleSelectAnswer(idx, option)}
                  className={cn(
                    "w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    selectedAnswers[idx] === option
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
            variant="quiz"
          >
            {isSubmitting ? "Submitting..." : "Submit Quiz"}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}

