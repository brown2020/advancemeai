"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Send } from "lucide-react";
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
import {
  buildLocalResults,
  countCorrect,
  createLocalSession,
  fetchPracticeQuestions,
} from "./fullTestHelpers";
import {
  QuestionLoadingSkeleton,
  ErrorCard,
} from "@/components/practice/PracticeComponents";
import { Button } from "@/components/ui/button";
import { TestTopBar } from "@/components/practice/TestTopBar";
import { TestBottomBar } from "@/components/practice/TestBottomBar";
import { QuestionView } from "@/components/practice/QuestionView";
import { AnswerChoices } from "@/components/practice/AnswerChoices";
import { AnswerFeedback } from "@/components/practice/AnswerFeedback";
import { QuestionNavigator } from "@/components/practice/QuestionNavigator";
import { useCountdown } from "@/components/practice/useCountdown";

export default function FullTestClient({
  authIsGuaranteed = false,
}: {
  authIsGuaranteed?: boolean;
}) {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [session, setSession] = useState<FullTestSession | null>(null);
  const [isLocalSession, setIsLocalSession] = useState(false);
  const [localAttempts, setLocalAttempts] = useState<
    Partial<Record<FullTestSectionId, FullTestSectionAttempt>>
  >({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [readingPassage, setReadingPassage] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sectionStartTime, setSectionStartTime] = useState(() => Date.now());
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const remainingSeconds = useCountdown(timerSeconds);
  /** Section index already auto-submitted on timeout (prevents repeats). */
  const autoSubmittedSectionRef = useRef<number | null>(null);

  const section = session?.sections[currentSectionIndex];
  const sectionTitle = section?.title ?? "Section";
  const sectionId = section?.id;
  const totalQuestionsTarget = section?.questionCount ?? 0;

  const loadSection = useCallback(
    async (nextSectionIndex: number) => {
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

      try {
        if (nextSection.id === "reading-writing") {
          const readingCount = Math.ceil(nextSection.questionCount / 2);
          const writingCount = Math.max(
            nextSection.questionCount - readingCount,
            0
          );
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
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load section questions"
        );
        setIsLoading(false);
      }
    },
    [session]
  );

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) return;

    setIsLoading(true);
    createFullTestSession()
      .then((newSession) => {
        setSession(newSession);
      })
      .catch(() => {
        setError(null);
        setIsLocalSession(true);
        setSession(createLocalSession(user.uid));
        setIsLoading(false);
      });
  }, [isAuthLoading, user]);

  useEffect(() => {
    if (!session) return;
    void loadSection(0);
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

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = currentQuestion
    ? selectedAnswers[currentQuestion.id]
    : undefined;

  const handleAnswerSelect = (value: string) => {
    if (!currentQuestion) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
    setShowFeedback(false);
  };

  const handleCheckAnswer = () => {
    if (!currentQuestion || !selectedAnswer) return;
    setIsCorrect(selectedAnswer === currentQuestion.correctAnswer);
    setShowFeedback(true);
  };

  const goToQuestion = (index: number) => {
    setShowFeedback(false);
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const handleSubmitSection = async () => {
    if (!session || !sectionId) return;

    try {
      setIsSubmitting(true);
      const timeSpentSeconds = Math.floor(
        (Date.now() - sectionStartTime) / 1000
      );

      const attemptPayload: FullTestSectionAttempt = {
        sectionId,
        answers: selectedAnswers,
        score: countCorrect(questions, selectedAnswers),
        totalQuestions: totalQuestionsTarget,
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
        return;
      }

      if (isLocalSession) {
        const attempts = Object.values({
          ...localAttempts,
          [sectionId]: attemptPayload,
        });
        const localResults = buildLocalResults(
          session.id,
          user?.uid ?? "local",
          attempts
        );
        localStorage.setItem(
          `full-test-results-${session.id}`,
          JSON.stringify(localResults)
        );
      } else {
        await completeFullTestSession(session.id);
      }
      router.push(ROUTES.PRACTICE.FULL_TEST_RESULTS(session.id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit section answers"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-submit the section once when its timer runs out.
  useEffect(() => {
    if (remainingSeconds !== 0 || isSubmitting) return;
    if (autoSubmittedSectionRef.current === currentSectionIndex) return;
    autoSubmittedSectionRef.current = currentSectionIndex;
    void handleSubmitSection();
  }, [remainingSeconds, isSubmitting]);

  if (isAuthLoading) {
    return <QuestionLoadingSkeleton />;
  }

  if (!user) {
    return (
      <ErrorCard
        message={
          authIsGuaranteed
            ? "Your session expired. Please sign in again to start the full test."
            : "You must be logged in to start a full test."
        }
      />
    );
  }

  if (error) {
    return <ErrorCard message={error} />;
  }

  if (isLoading || !section) {
    return (
      <QuestionLoadingSkeleton
        message={
          section
            ? `Preparing ${section.title}...`
            : "Preparing your full-length test..."
        }
      />
    );
  }

  if (!session) {
    return <ErrorCard message="Unable to start the full-length test session." />;
  }

  if (!currentQuestion) {
    return <ErrorCard message="No questions found for this section." />;
  }

  const answeredCount = Object.keys(selectedAnswers).length;
  const hasAllQuestions = questions.length >= totalQuestionsTarget;
  const canSubmit =
    (hasAllQuestions && answeredCount === totalQuestionsTarget) ||
    remainingSeconds === 0;
  const canCheck = !showFeedback && Boolean(selectedAnswer);
  const isLastSection = currentSectionIndex === session.sections.length - 1;

  return (
    <div className="flex min-h-[calc(100svh-4rem)] flex-col">
      <TestTopBar
        eyebrow={`Section ${currentSectionIndex + 1} of ${session.sections.length}`}
        title={sectionTitle}
        current={currentQuestionIndex + 1}
        total={totalQuestionsTarget}
        remainingSeconds={remainingSeconds}
        confirmExit
      />

      <main className="flex-1">
        <QuestionView
          questionNumber={currentQuestionIndex + 1}
          questionText={currentQuestion.text}
          passage={sectionId === "reading-writing" ? readingPassage : null}
        >
          <AnswerChoices
            options={currentQuestion.options}
            selected={selectedAnswer}
            onSelect={handleAnswerSelect}
            revealed={showFeedback}
            correctAnswer={currentQuestion.correctAnswer}
          />
          {showFeedback && isCorrect !== null && (
            <AnswerFeedback
              isCorrect={isCorrect}
              explanation={currentQuestion.explanation}
              correctAnswer={currentQuestion.correctAnswer}
            />
          )}
          <p className="text-sm tabular-nums text-muted-foreground md:hidden">
            {answeredCount} of {totalQuestionsTarget} answered
          </p>
        </QuestionView>
      </main>

      <TestBottomBar
        onBack={() => goToQuestion(currentQuestionIndex - 1)}
        onNext={() => goToQuestion(currentQuestionIndex + 1)}
        canGoBack={currentQuestionIndex > 0}
        canGoNext={currentQuestionIndex < questions.length - 1}
        status={
          <QuestionNavigator
            total={totalQuestionsTarget}
            currentIndex={currentQuestionIndex}
            available={questions.length}
            isAnswered={(index) => {
              const question = questions[index];
              return Boolean(question && selectedAnswers[question.id]);
            }}
            onJump={goToQuestion}
          />
        }
      >
        {canCheck && (
          <Button
            type="button"
            variant={canSubmit ? "outline" : "default"}
            onClick={handleCheckAnswer}
          >
            <CheckCheck aria-hidden />
            Check answer
          </Button>
        )}
        {canSubmit && (
          <Button
            type="button"
            onClick={handleSubmitSection}
            isLoading={isSubmitting}
          >
            {!isSubmitting && <Send aria-hidden />}
            {isSubmitting
              ? "Submitting..."
              : isLastSection
                ? "Finish test"
                : "Submit section"}
          </Button>
        )}
      </TestBottomBar>
    </div>
  );
}
