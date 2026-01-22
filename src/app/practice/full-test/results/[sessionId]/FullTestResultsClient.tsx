"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useStreamingResponse } from "@/hooks/useStreamingResponse";
import { getFullTestResults } from "@/services/practiceTestService";
import { ROUTES, SECTION_TITLES } from "@/constants/appConstants";
import type { FullTestResults } from "@/types/practice-test";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";

export default function FullTestResultsClient({
  sessionId,
  authIsGuaranteed = false,
}: {
  sessionId: string;
  authIsGuaranteed?: boolean;
}) {
  const router = useRouter();
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

    async function loadResults() {
      try {
        setIsLoading(true);
        const data = await getFullTestResults(sessionId);
        setResults(data);
      } catch (err) {
        const local = localStorage.getItem(`full-test-results-${sessionId}`);
        if (local) {
          try {
            const parsed = JSON.parse(local) as FullTestResults;
            setResults(parsed);
            setError(null);
            return;
          } catch {
            // fall through to error
          }
        }
        setError(
          err instanceof Error ? err.message : "Failed to load test results"
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadResults();
  }, [sessionId]);

  useEffect(() => {
    if (!results || planRequested) return;
    setPlanRequested(true);

    const sections = results.sections.map((section) => ({
      sectionId: section.sectionId,
      title: SECTION_TITLES[section.sectionId] || section.sectionId,
      score: section.score,
      totalQuestions: section.totalQuestions,
      timeSpentSeconds: section.timeSpentSeconds,
    }));

    const payload = {
      overall: {
        score: results.totalScore,
        totalQuestions: results.totalQuestions,
        totalTimeSeconds: results.totalTimeSeconds,
      },
      sections,
      strengths: results.strengths,
      weaknesses: results.weaknesses,
    };

    fetch("/api/ai/study-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(streamResponse)
      .catch(() => null);
  }, [results, planRequested, streamResponse]);

  const overallAccuracy = useMemo(() => {
    if (!results || results.totalQuestions === 0) return 0;
    return Math.round((results.totalScore / results.totalQuestions) * 100);
  }, [results]);

  if (isAuthLoading) {
    return (
      <div className="container mx-auto p-4">
        <Card className="w-full max-w-3xl mx-auto">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              {authIsGuaranteed ? "Loading test results..." : "Checking session..."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <Card className="w-full max-w-3xl mx-auto">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {authIsGuaranteed
                  ? "Your session expired. Please sign in again to view results."
                  : "You must be logged in to view test results."}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card className="w-full max-w-3xl mx-auto">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !results) {
    return (
      <div className="container mx-auto p-4">
        <Card className="w-full max-w-3xl mx-auto">
          <CardContent className="pt-6">Loading results...</CardContent>
        </Card>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Full-length Digital SAT Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Score</p>
              <p className="text-2xl font-bold">
                {results.totalScore} / {results.totalQuestions}
              </p>
              <p className="text-sm text-muted-foreground">{overallAccuracy}%</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Time Spent</p>
              <p className="text-2xl font-bold">
                {formatTime(results.totalTimeSeconds)}
              </p>
              <p className="text-sm text-muted-foreground">
                Completed on {new Date(results.completedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Focus Areas</p>
              <p className="text-sm text-muted-foreground">
                Strengths: {results.strengths.join(", ") || "N/A"}
              </p>
              <p className="text-sm text-muted-foreground">
                Weaknesses: {results.weaknesses.join(", ") || "N/A"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {results.sections.map((section) => {
              const title = SECTION_TITLES[section.sectionId] || section.sectionId;
              const accuracy =
                section.totalQuestions > 0
                  ? Math.round((section.score / section.totalQuestions) * 100)
                  : 0;
              const incorrectQuestions =
                section.questionsData?.filter(
                  (question) => section.answers[question.id] !== question.correctAnswer
                ) ?? [];

              return (
                <div key={section.sectionId} className="border rounded-lg p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold">{title}</p>
                      <p className="text-sm text-muted-foreground">
                        {section.score}/{section.totalQuestions} correct ({accuracy}%)
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Time: {formatTime(section.timeSpentSeconds)}
                    </div>
                  </div>

                  {incorrectQuestions.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {incorrectQuestions.map((question, index) => (
                        <div key={question.id} className="rounded-md border p-3">
                          <div className="flex items-start gap-2">
                            <XCircle className="h-5 w-5 text-red-500 mt-1" />
                            <div>
                              <p className="font-medium">
                                {index + 1}. {question.text}
                              </p>
                              <p className="text-sm mt-1">
                                <span className="font-medium">Your answer:</span>{" "}
                                {section.answers[question.id] || "No answer"}
                              </p>
                              <p className="text-sm mt-1">
                                <span className="font-medium">Correct answer:</span>{" "}
                                {question.correctAnswer}
                              </p>
                              {question.explanation && (
                                <p className="text-sm mt-2 text-muted-foreground">
                                  {question.explanation}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 text-sm text-muted-foreground flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      All questions correct in this section.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => router.push(ROUTES.PRACTICE.INDEX)}>
            Back to Practice
          </Button>
        </CardFooter>
      </Card>

      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Personalized Study Plan</CardTitle>
        </CardHeader>
        <CardContent>
          {planError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{planError}</AlertDescription>
            </Alert>
          )}
          {!planError && (
            <div className="whitespace-pre-line text-sm text-muted-foreground">
              {planContent ||
                (isStreaming
                  ? "Generating your study plan..."
                  : "Study plan will appear here shortly.")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
