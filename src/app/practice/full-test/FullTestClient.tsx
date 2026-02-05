"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import type { Question } from "@/types/question";
import type {
  FullTestSectionAttempt,
  FullTestSectionId,
  FullTestSession,
} from "@/types/practice-test";
import {
  createFullTestSession,
  submitFullTestSection,
  completeFullTestSession,
} from "@/services/practiceTestService";
import { ROUTES } from "@/constants/appConstants";
import { DIGITAL_SAT_SECTIONS } from "@/constants/sat";
import {
  TimerDisplay,
  ProgressSummary,
  QuestionLoadingSkeleton,
  ErrorCard,
  ReadingPassageCard,
  formatTimer,
} from "@/components/practice/PracticeComponents";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle } from "lucide-react";

export default function FullTestClient({
  authIsGuaranteed = false,
}: {
  authIsGuaranteed?: boolean;
}) {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [session, setSession] = useState<FullTestSession | null>(null);
  const [isLocalSession, setIsLocalSession] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>(
    {}
  );
  const [readingPassage, setReadingPassage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [sectionStartTime, setSectionStartTime] = useState(Date.now());
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [localAttempts, setLocalAttempts] = useState<
    Partial<Record<FullTestSectionId, FullTestSectionAttempt>>
  >({});

  const section = session?.sections[currentSectionIndex];
  const sectionTitle = section?.title ?? "Section";
  const sectionId = section?.id as FullTestSectionId | undefined;
  const totalQuestionsTarget = section?.questionCount ?? 0;

  const fetchPracticeQuestions = async (
    sectionKey: "reading" | "writing" | "math-calc",
    count: number
  ) => {
    const response = await fetch(
      `/api/questions/${sectionKey}?count=${count}`,
      { credentials: "include" }
    );
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const message =
        body && typeof body === "object" && "error" in body
          ? String(body.error)
          : "Failed to fetch practice questions";
      throw new Error(message);
    }
    return response.json() as Promise<{
      questions: Question[];
      readingPassage?: string | null;
    }>;
  };

  useEffect(() => {
    if (timerSeconds === null) {
      setRemainingSeconds(null);
      return;
    }

    setRemainingSeconds(timerSeconds);
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null) return prev;
        return prev > 0 ? prev - 1 : 0;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerSeconds]);

  const formattedTimer = useMemo(
    () => formatTimer(remainingSeconds),
    [remainingSeconds]
  );

  const loadSection = useCallback(async (nextSectionIndex: number) => {
    if (!session) return;
    const nextSection = session.sections[nextSectionIndex];
    if (!nextSection) return;

    setIsLoading(true);
    setError(null);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowFeedback(false);
    setIsCorrect(null);
    setReadingPassage(null);
    setTimerSeconds(nextSection.timeLimitMinutes * 60);
    setSectionStartTime(Date.now());
    setIsFetchingMore(false);

    try {
      if (nextSection.id === "reading-writing") {
        const readingCount = Math.ceil(nextSection.questionCount / 2);
        const writingCount = Math.max(nextSection.questionCount - readingCount, 0);
        const readingData = await fetchPracticeQuestions("reading", readingCount);
        const writingData = await fetchPracticeQuestions("writing", writingCount);
        setQuestions([
          ...(readingData.questions ?? []),
          ...(writingData.questions ?? []),
        ]);
        setReadingPassage(readingData.readingPassage ?? null);
      } else {
        const mathData = await fetchPracticeQuestions(
          "math-calc",
          nextSection.questionCount
        );
        setQuestions(mathData.questions ?? []);
      }
      setIsLoading(false);
      setIsFetchingMore(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load section questions"
      );
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) return;

    setIsLoading(true);
    createFullTestSession()
      .then((newSession) => {
        setSession(newSession);
      })
      .catch((_err) => {
        setError(null);
        setIsLocalSession(true);
        setSession({
          id: `local-${Date.now()}`,
          userId: user.uid,
          status: "in_progress",
          sections: DIGITAL_SAT_SECTIONS.map((section) => ({
            id: section.id,
            title: section.title,
            description: section.description,
            questionCount: section.questionCount,
            timeLimitMinutes: section.timeLimitMinutes,
          })),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        setIsLoading(false);
      });
  }, [isAuthLoading, user]);

  useEffect(() => {
    if (!session) return;
    loadSection(0);
  }, [session, loadSection]);

  useEffect(() => {
    if (!isLoading) return;
    const timeoutId = setTimeout(() => {
      if (!session && !error) {
        setError("Timed out starting the full-length test. Please try again.");
        setIsLoading(false);
      }
    }, 20000);

    return () => clearTimeout(timeoutId);
  }, [isLoading, session, error]);

  const handleAnswerSelect = (value: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
    }));
    setShowFeedback(false);
  };

  const handleCheckAnswer = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;
    if (!selectedAnswers[currentQuestion.id]) return;

    const correct =
      selectedAnswers[currentQuestion.id] === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    setShowFeedback(true);
  };

  const handlePrevious = () => {
    setShowFeedback(false);
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    setShowFeedback(false);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleSubmitSection = async () => {
    if (!session || !sectionId) return;

    try {
      setIsSubmitting(true);
      const timeSpentSeconds = Math.floor(
        (Date.now() - sectionStartTime) / 1000
      );
      const totalQuestions = totalQuestionsTarget;
      const score = questions.reduce(
        (acc, question) =>
          acc + (selectedAnswers[question.id] === question.correctAnswer ? 1 : 0),
        0
      );

      const attemptPayload: FullTestSectionAttempt = {
        sectionId,
        answers: selectedAnswers,
        score,
        totalQuestions,
        timeSpentSeconds,
        questionsData: questions.map((question) => ({
          id: question.id,
          text: question.text,
          options: question.options,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          sectionId: question.sectionId,
        })),
      };

      if (isLocalSession) {
        setLocalAttempts((prev) => ({ ...prev, [sectionId]: attemptPayload }));
      } else {
        await submitFullTestSection(session.id, sectionId, attemptPayload);
      }

      const nextIndex = currentSectionIndex + 1;
      if (nextIndex < session.sections.length) {
        setCurrentSectionIndex(nextIndex);
        await loadSection(nextIndex);
      } else {
        if (isLocalSession) {
          const attempts = Object.values({
            ...localAttempts,
            [sectionId]: attemptPayload,
          });
          const totalScore = attempts.reduce(
            (sum, attempt) => sum + attempt.score,
            0
          );
          const totalQuestions = attempts.reduce(
            (sum, attempt) => sum + attempt.totalQuestions,
            0
          );
          const totalTimeSeconds = attempts.reduce(
            (sum, attempt) => sum + attempt.timeSpentSeconds,
            0
          );

          const strengths = attempts
            .filter((attempt) =>
              attempt.totalQuestions > 0
                ? attempt.score / attempt.totalQuestions >= 0.8
                : false
            )
            .map((attempt) => attempt.sectionId);
          const weaknesses = attempts
            .filter((attempt) =>
              attempt.totalQuestions > 0
                ? attempt.score / attempt.totalQuestions <= 0.6
                : false
            )
            .map((attempt) => attempt.sectionId);

          const localResults = {
            id: `local-results-${Date.now()}`,
            sessionId: session.id,
            userId: user?.uid ?? "local",
            status: "completed",
            sections: attempts,
            totalScore,
            totalQuestions,
            totalTimeSeconds,
            completedAt: Date.now(),
            strengths,
            weaknesses,
          };
          localStorage.setItem(
            `full-test-results-${session.id}`,
            JSON.stringify(localResults)
          );
          router.push(ROUTES.PRACTICE.FULL_TEST_RESULTS(session.id));
        } else {
          await completeFullTestSession(session.id);
          router.push(ROUTES.PRACTICE.FULL_TEST_RESULTS(session.id));
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit section answers"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (remainingSeconds === 0 && !isSubmitting) {
      handleSubmitSection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds, isSubmitting]);

  if (isAuthLoading) {
    return (
      <div className="container mx-auto p-4">
        <QuestionLoadingSkeleton />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <ErrorCard
          message={
            authIsGuaranteed
              ? "Your session expired. Please sign in again to start the full test."
              : "You must be logged in to start a full test."
          }
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <ErrorCard message={error} />
      </div>
    );
  }

  if (isLoading || !section) {
    return (
      <div className="container mx-auto p-4">
        <QuestionLoadingSkeleton />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Preparing your full-length test...
        </p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto p-4">
        <ErrorCard message="Unable to start the full-length test session." />
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) {
    return (
      <div className="container mx-auto p-4">
        <ErrorCard message="No questions found for this section." />
      </div>
    );
  }

  const answeredCount = Object.keys(selectedAnswers).length;
  const hasAllQuestions = questions.length >= totalQuestionsTarget;
  const canSubmit =
    (hasAllQuestions && answeredCount === totalQuestionsTarget) ||
    remainingSeconds === 0;

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 space-y-3">
        {formattedTimer && <TimerDisplay formattedTimer={formattedTimer} />}
        <div className="text-sm text-muted-foreground">
          Section {currentSectionIndex + 1} of {session.sections.length}:{" "}
          {sectionTitle}
        </div>
        {isFetchingMore && (
          <div className="text-xs text-muted-foreground">
            Loading more questions... ({questions.length}/{totalQuestionsTarget})
          </div>
        )}
      </div>

      {readingPassage && sectionId === "reading-writing" && (
        <ReadingPassageCard passage={readingPassage} />
      )}

      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader className="flex flex-col gap-2">
          <CardTitle>
            Question {currentQuestionIndex + 1} of {totalQuestionsTarget}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <p className="text-lg font-medium">{currentQuestion.text}</p>
          </div>
          <RadioGroup
            value={selectedAnswers[currentQuestion.id] || ""}
            onValueChange={handleAnswerSelect}
            className="space-y-3"
          >
            {currentQuestion.options.map((option, index) => (
              <div
                key={index}
                className={`flex items-center space-x-2 rounded-md border p-3 ${
                  showFeedback && option === currentQuestion.correctAnswer
                    ? "border-green-500 bg-green-50"
                    : showFeedback &&
                        option === selectedAnswers[currentQuestion.id] &&
                        option !== currentQuestion.correctAnswer
                      ? "border-red-500 bg-red-50"
                      : ""
                }`}
              >
                <RadioGroupItem
                  value={option}
                  id={`option-${index}`}
                  disabled={showFeedback}
                />
                <Label htmlFor={`option-${index}`} className="grow">
                  {option}
                </Label>
                {showFeedback && option === currentQuestion.correctAnswer && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {showFeedback &&
                  option === selectedAnswers[currentQuestion.id] &&
                  option !== currentQuestion.correctAnswer && (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
              </div>
            ))}
          </RadioGroup>

          {showFeedback && (
            <div
              className={`mt-6 p-4 rounded-md ${
                isCorrect
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="flex items-start gap-2">
                {isCorrect ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 mt-1" />
                )}
                <div>
                  <p className="font-medium mb-2">
                    {isCorrect ? "Correct!" : "Incorrect"}
                  </p>
                  {currentQuestion.explanation && (
                    <p className="text-sm">
                      <span className="font-medium">Explanation:</span>{" "}
                      {currentQuestion.explanation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <ProgressSummary
            answeredCount={answeredCount}
            totalQuestions={totalQuestionsTarget}
            score={questions.reduce(
              (acc, question) =>
                acc +
                (selectedAnswers[question.id] === question.correctAnswer ? 1 : 0),
              0
            )}
          />
        </CardContent>
        <CardFooter className="flex flex-col gap-3 md:flex-row md:justify-between">
          <div>
            <Button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              variant="outline"
              className="mr-2"
            >
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={currentQuestionIndex >= questions.length - 1}
              variant="outline"
            >
              Next
            </Button>
          </div>
          <div>
            {!showFeedback && selectedAnswers[currentQuestion.id] && (
              <Button onClick={handleCheckAnswer} className="mr-2">
                Check Answer
              </Button>
            )}
            {canSubmit && (
              <Button onClick={handleSubmitSection} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Section"}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
