"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Target,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useStreamingResponse } from "@/hooks/useStreamingResponse";
import { getFullTestResults } from "@/services/practiceTestService";
import { ROUTES, SECTION_TITLES } from "@/constants/appConstants";
import type { FullTestResults } from "@/types/practice-test";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Badge } from "@/components/ui/badge";
import {
  PageContainer,
  PageHeader,
  SectionContainer,
  SectionHeading,
  ErrorDisplay,
} from "@/components/common/UIComponents";
import { ErrorCard } from "@/components/practice/PracticeComponents";
import {
  QuestionReviewList,
  ResultsSkeleton,
  ScoreBreakdown,
  ScoreSummary,
} from "@/components/practice/ResultsSummary";
import { formatDuration } from "@/components/practice/sectionMeta";

const titleFor = (sectionId: string) => SECTION_TITLES[sectionId] || sectionId;

function FocusList({
  label,
  items,
  variant,
}: {
  label: string;
  items: string[];
  variant: "success" | "warning";
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{label}</p>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <Badge key={item} variant={variant}>
              {titleFor(item)}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">None yet</p>
      )}
    </div>
  );
}

export default function FullTestResultsClient({
  sessionId,
  authIsGuaranteed = false,
}: {
  sessionId: string;
  authIsGuaranteed?: boolean;
}) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [results, setResults] = useState<FullTestResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planRequested, setPlanRequested] = useState(false);

  const {
    isStreaming,
    content: planContent,
    error: planError,
    streamResponse,
  } = useStreamingResponse();

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    setIsLoading(true);
    getFullTestResults(sessionId).then(
      (data) => {
        if (cancelled) return;
        setResults(data);
        setIsLoading(false);
      },
      (err: unknown) => {
        if (cancelled) return;
        const recovered = readLocalResults(sessionId);
        if (recovered) {
          setResults(recovered);
          setError(null);
          setIsLoading(false);
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load test results");
        setIsLoading(false);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const requestStudyPlan = () => {
    if (!results || planRequested || isStreaming) return;
    setPlanRequested(true);
    void requestStudyPlanText(results).then(streamResponse).catch(() => null);
  };

  if (isAuthLoading) {
    return (
      <ResultsSkeleton
        message={
          authIsGuaranteed ? "Loading test results..." : "Checking session..."
        }
      />
    );
  }

  if (!user) {
    return (
      <ErrorCard
        message={
          authIsGuaranteed
            ? "Your session expired. Please sign in again to view results."
            : "You must be logged in to view test results."
        }
      />
    );
  }

  if (error) {
    return <ErrorCard message={error} />;
  }

  if (isLoading || !results) {
    return <ResultsSkeleton message="Loading results..." />;
  }

  return (
    <FullTestResultsBody
      results={results}
      planRequested={planRequested}
      isStreaming={isStreaming}
      planContent={planContent}
      planError={planError}
      onRequestPlan={requestStudyPlan}
    />
  );
}

function FullTestResultsBody({
  results,
  planRequested,
  isStreaming,
  planContent,
  planError,
  onRequestPlan,
}: {
  results: FullTestResults;
  planRequested: boolean;
  isStreaming: boolean;
  planContent: string;
  planError: string | null;
  onRequestPlan: () => void;
}) {
  const breakdown = results.sections.map((section) => ({
    id: section.sectionId,
    label: titleFor(section.sectionId),
    score: section.score,
    total: section.totalQuestions,
    meta: formatDuration(section.timeSpentSeconds),
  }));

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Full-length Digital SAT"
        title="Your results"
        description="Here's how you did across each section, plus what to work on next."
      />

      <ScoreSummary
        score={results.totalScore}
        total={results.totalQuestions}
        timeSeconds={results.totalTimeSeconds}
        completedAt={results.completedAt}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionContainer className="lg:col-span-2">
          <SectionHeading title="Section breakdown" icon={<BarChart3 />} />
          <ScoreBreakdown items={breakdown} />
        </SectionContainer>

        <SectionContainer>
          <SectionHeading title="Focus areas" icon={<Target />} />
          <div className="space-y-4">
            <FocusList label="Strengths" items={results.strengths} variant="success" />
            <FocusList
              label="Needs work"
              items={results.weaknesses}
              variant="warning"
            />
          </div>
        </SectionContainer>
      </div>

      <section className="mb-8 rounded-3xl border border-primary/20 bg-accent/60 p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="size-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Personalized study plan</h2>
              <p className="text-sm text-muted-foreground">
                AI turns these results into a focused plan for your next few
                weeks.
              </p>
            </div>
          </div>
          {!planRequested && !isStreaming && !planContent && (
            <Button type="button" size="lg" onClick={onRequestPlan}>
              Generate study plan
            </Button>
          )}
        </div>
        {planError && <ErrorDisplay message={planError} className="mb-0 mt-4" />}
        {!planError && (planContent || isStreaming) && (
          <div
            aria-live="polite"
            className="mt-5 whitespace-pre-line rounded-2xl bg-card p-4 text-sm leading-relaxed sm:p-5"
          >
            {planContent || "Generating your study plan..."}
          </div>
        )}
      </section>

      <MissedQuestions sections={results.sections} />

      <div className="mt-10 flex flex-wrap gap-2">
        <Link
          href={ROUTES.PRACTICE.FULL_TEST}
          className={buttonVariants({ variant: "outline" })}
        >
          <RotateCcw aria-hidden />
          Take another full test
        </Link>
        <Link
          href={ROUTES.PRACTICE.INDEX}
          className={buttonVariants({ variant: "ghost" })}
        >
          Back to SAT Prep
        </Link>
      </div>
    </PageContainer>
  );
}

function MissedQuestions({ sections }: { sections: FullTestResults["sections"] }) {
  return (
    <>
      <SectionHeading title="Missed questions" icon={<XCircle />} />
      <div className="space-y-6">
        {sections.map((section) => (
          <MissedSection key={section.sectionId} section={section} />
        ))}
      </div>
    </>
  );
}

function MissedSection({ section }: { section: FullTestResults["sections"][number] }) {
  const incorrect =
    section.questionsData?.filter(
      (question) => section.answers[question.id] !== question.correctAnswer
    ) ?? [];

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {titleFor(section.sectionId)}
      </h3>
      {incorrect.length > 0 ? (
        <QuestionReviewList
          questions={incorrect.map((question) => ({
            id: question.id,
            text: question.text,
            userAnswer: section.answers[question.id],
            correctAnswer: question.correctAnswer,
            isCorrect: false,
            explanation: question.explanation,
          }))}
        />
      ) : (
        <p className="flex items-center gap-2 rounded-2xl bg-success/10 p-4 text-sm font-medium text-success">
          <CheckCircle2 className="size-4" aria-hidden />
          All questions correct in this section.
        </p>
      )}
    </div>
  );
}

function requestStudyPlanText(results: FullTestResults): Promise<Response> {
  const sections = results.sections.map((section) => ({
    sectionId: section.sectionId,
    title: titleFor(section.sectionId),
    score: section.score,
    totalQuestions: section.totalQuestions,
    timeSpentSeconds: section.timeSpentSeconds,
  }));

  return fetch("/api/ai/study-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      overall: {
        score: results.totalScore,
        totalQuestions: results.totalQuestions,
        totalTimeSeconds: results.totalTimeSeconds,
      },
      sections,
      strengths: results.strengths,
      weaknesses: results.weaknesses,
    }),
  });
}

function readLocalResults(sessionId: string): FullTestResults | null {
  const local = localStorage.getItem(`full-test-results-${sessionId}`);
  if (!local) return null;
  try {
    return JSON.parse(local) as FullTestResults;
  } catch {
    return null;
  }
}
