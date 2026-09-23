"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Progress } from "@/components/ui/progress";
import {
  EmptyState,
  ErrorDisplay,
  LoadingState,
  PageContainer,
  PageHeader,
} from "@/components/common/UIComponents";
import { useAuth } from "@/lib/auth";
import { SignInGate, SignInGateIcons } from "@/components/auth/SignInGate";
import { QuizQuestionCard } from "@/components/quizzes/QuizQuestionCard";
import { QuizResults } from "@/components/quizzes/QuizResults";
import {
  countCorrect,
  type QuizAnswers,
  type TakeableQuiz,
} from "@/components/quizzes/quiz-utils";
import { ROUTES } from "@/constants/appConstants";

export default function QuizDetailClient({
  quizId,
  authIsGuaranteed = false,
  initialQuiz,
}: {
  quizId: string;
  authIsGuaranteed?: boolean;
  initialQuiz?: TakeableQuiz;
}) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const quiz = initialQuiz ?? null;
  const error =
    !initialQuiz && quizId
      ? "Unable to load this quiz. Please sign in and try again."
      : null;

  if (isAuthLoading) {
    return (
      <PageContainer width="narrow">
        <LoadingState
          message={authIsGuaranteed ? "Loading quiz..." : "Checking your session..."}
        />
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer width="narrow">
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
      <PageContainer width="narrow">
        <PageHeader title="Quiz" />
        <ErrorDisplay message={error} />
        <Link href={ROUTES.QUIZZES.INDEX} className={buttonVariants({ variant: "outline" })}>
          Back to quizzes
        </Link>
      </PageContainer>
    );
  }

  if (!quiz) {
    return (
      <PageContainer width="narrow">
        <LoadingState message="Loading quiz..." />
      </PageContainer>
    );
  }

  if (quiz.questions.length === 0) {
    return (
      <PageContainer width="narrow">
        <PageHeader title={quiz.title} />
        <EmptyState
          icon={<ClipboardCheck />}
          title="This quiz has no questions"
          message="There's nothing to answer here yet."
          actionLink={ROUTES.QUIZZES.INDEX}
          actionText="Back to quizzes"
        />
      </PageContainer>
    );
  }

  return <QuizSession quiz={quiz} />;
}

/** One-question-at-a-time quiz run with a results screen at the end. */
function QuizSession({ quiz }: { quiz: TakeableQuiz }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [finished, setFinished] = useState(false);

  const total = quiz.questions.length;
  const question = quiz.questions[index];
  const selected = answers[index];
  const isLast = index === total - 1;
  const answeredCount = Object.keys(answers).length;

  const selectAnswer = (option: string) => {
    if (answers[index] !== undefined) return;
    setAnswers((prev) => ({ ...prev, [index]: option }));
  };

  const goNext = () => {
    if (isLast) setFinished(true);
    else setIndex((i) => i + 1);
  };

  const retake = () => {
    setAnswers({});
    setIndex(0);
    setFinished(false);
  };

  // Keyboard: 1-9 / A-D pick an answer, Enter advances once answered.
  useEffect(() => {
    if (finished || !question) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;

      if (e.key === "Enter" && selected !== undefined) {
        e.preventDefault();
        goNext();
        return;
      }
      if (selected !== undefined) return;
      const key = e.key.toUpperCase();
      const pick = /^[1-9]$/.test(key)
        ? Number(key) - 1
        : /^[A-Z]$/.test(key)
          ? key.charCodeAt(0) - 65
          : -1;
      const option = question.options[pick];
      if (option !== undefined) selectAnswer(option);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (finished) {
    return (
      <PageContainer width="narrow">
        <PageHeader eyebrow="Quiz complete" title={quiz.title} />
        <QuizResults quiz={quiz} answers={answers} onRetake={retake} />
      </PageContainer>
    );
  }

  if (!question) return null;

  const correctSoFar = countCorrect(quiz, answers);

  return (
    <PageContainer width="narrow">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={ROUTES.QUIZZES.INDEX}
          aria-label="Exit quiz"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <X aria-hidden />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
            <h1 className="truncate font-semibold">{quiz.title}</h1>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {index + 1} / {total}
            </span>
          </div>
          <Progress
            value={(answeredCount / total) * 100}
            label={`${answeredCount} of ${total} answered`}
          />
        </div>
      </div>

      <QuizQuestionCard
        key={index}
        question={question}
        selected={selected}
        onSelect={selectAnswer}
      />

      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-sm tabular-nums text-muted-foreground">
          {correctSoFar} correct
        </p>
        <Button size="lg" onClick={goNext} disabled={selected === undefined}>
          {isLast ? "See results" : "Next question"}
          <ArrowRight aria-hidden />
        </Button>
      </div>
    </PageContainer>
  );
}
