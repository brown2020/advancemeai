"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ListChecks, RotateCcw, PartyPopper } from "lucide-react";
import { ROUTES, SECTION_TITLES } from "@/constants/appConstants";
import { useAuth } from "@/lib/auth";
import { getTestAttempt, type TestAttempt } from "@/services/practiceTestService";
import {
  PageContainer,
  PageHeader,
  SectionHeading,
  EmptyState,
} from "@/components/common/UIComponents";
import { buttonVariants } from "@/components/ui/button-variants";
import { Segmented } from "@/components/ui/segmented";
import { ErrorCard } from "@/components/practice/PracticeComponents";
import {
  QuestionReviewList,
  ResultsSkeleton,
  ScoreSummary,
  type ReviewQuestion,
} from "@/components/practice/ResultsSummary";

interface TestResult extends TestAttempt {
  sectionTitle: string;
  questions: ReviewQuestion[];
}

function convertAttemptToResult(attempt: TestAttempt): TestResult {
  const questions = Object.entries(attempt.answers).map(([id, answer], index) => {
    const questionData = attempt.questionsData?.find((q) => q.id === id);
    if (questionData) {
      return {
        id,
        number: index + 1,
        text: questionData.text,
        userAnswer: answer,
        correctAnswer: questionData.correctAnswer,
        isCorrect: answer === questionData.correctAnswer,
        explanation: questionData.explanation,
      };
    }

    return {
      id,
      number: index + 1,
      text: "Question",
      userAnswer: answer,
      correctAnswer: answer,
      isCorrect: true,
    };
  });

  return {
    ...attempt,
    sectionTitle: SECTION_TITLES[attempt.sectionId] || attempt.sectionId,
    questions,
  };
}

type ReviewFilter = "missed" | "all";

export default function TestResultsClient({
  attemptId,
  authIsGuaranteed = false,
}: {
  attemptId: string;
  authIsGuaranteed?: boolean;
}) {
  const { user, isLoading: isAuthLoading } = useAuth();

  const [result, setResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReviewFilter>("missed");

  useEffect(() => {
    async function loadTestResult() {
      if (!attemptId) return;

      try {
        setIsLoading(true);
        const attempt = await getTestAttempt(attemptId);
        setResult(convertAttemptToResult(attempt));
      } catch {
        setError("Failed to load test results. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }

    loadTestResult();
  }, [attemptId]);

  if (isAuthLoading) {
    return (
      <ResultsSkeleton
        message={
          authIsGuaranteed ? "Loading test results..." : "Checking your session..."
        }
      />
    );
  }

  if (!user) {
    return (
      <ErrorCard
        message={
          authIsGuaranteed
            ? "Your session expired. Please sign in again to view test results."
            : "You must be logged in to view test results."
        }
      />
    );
  }

  if (error) {
    return <ErrorCard message={error} />;
  }

  if (isLoading || !result) {
    return <ResultsSkeleton message="Loading test results..." />;
  }

  const missed = result.questions.filter((question) => !question.isCorrect);
  const activeFilter: ReviewFilter = missed.length === 0 ? "all" : filter;
  const visibleQuestions = activeFilter === "missed" ? missed : result.questions;

  const nextActions = (
    <>
      <Link
        href={ROUTES.PRACTICE.SECTION(result.sectionId)}
        className={buttonVariants()}
      >
        <RotateCcw aria-hidden />
        Practice again
      </Link>
      <Link
        href={ROUTES.PRACTICE.INDEX}
        className={buttonVariants({ variant: "outline" })}
      >
        Back to SAT Prep
      </Link>
    </>
  );

  return (
    <PageContainer width="narrow">
      <PageHeader
        eyebrow="Practice results"
        title={result.sectionTitle}
        description="See how you did, then review the questions you missed."
      />

      <ScoreSummary
        score={result.score}
        total={result.totalQuestions}
        timeSeconds={result.timeSpent}
        completedAt={result.completedAt}
      />

      <SectionHeading
        title="Question review"
        icon={<ListChecks />}
        action={
          missed.length > 0 ? (
            <Segmented<ReviewFilter>
              label="Filter questions"
              value={activeFilter}
              onChange={setFilter}
              options={[
                { value: "missed", label: `Missed (${missed.length})` },
                { value: "all", label: `All (${result.questions.length})` },
              ]}
            />
          ) : undefined
        }
      />

      {result.questions.length === 0 ? (
        <EmptyState
          icon={<ListChecks />}
          title="No answers recorded"
          message="This attempt didn't include any answered questions."
        />
      ) : (
        <>
          {missed.length === 0 && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl bg-success/10 p-4 text-sm font-medium text-success">
              <PartyPopper className="size-5" aria-hidden />
              Perfect run — every answer was correct.
            </div>
          )}
          <QuestionReviewList questions={visibleQuestions} />
        </>
      )}

      <div className="mt-8 flex flex-wrap gap-2">{nextActions}</div>
    </PageContainer>
  );
}
