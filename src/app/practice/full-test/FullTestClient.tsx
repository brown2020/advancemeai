"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import {
  buildLocalResults,
  countCorrect,
  createLocalSession,
} from "./fullTestHelpers";
import { fetchSectionBundle } from "./full-test-session";
import {
  QuestionLoadingSkeleton,
  ErrorCard,
} from "@/components/practice/PracticeComponents";
import { useCountdown } from "@/components/practice/useCountdown";
import { FullTestScreen } from "./FullTestScreen";

function signedOutMessage(authIsGuaranteed: boolean): string {
  if (authIsGuaranteed) {
    return "Your session expired. Please sign in again to start the full test.";
  }
  return "You must be logged in to start a full test.";
}

function preparingMessage(section: { title: string } | undefined): string {
  if (section) return `Preparing ${section.title}...`;
  return "Preparing your full-length test...";
}

function sectionTitleOf(section: { title: string } | undefined): string {
  return section?.title ?? "Section";
}

function selectedChoice(
  question: Question | undefined,
  answers: Record<string, string>,
): string | undefined {
  if (!question) return undefined;
  return answers[question.id];
}

export default function FullTestClient({
  authIsGuaranteed = false,
}: {
  authIsGuaranteed?: boolean;
}) {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [session, setSession] = useState<FullTestSession | null>(null);
  const isLocalSessionRef = useRef(false);
  const localAttemptsRef = useRef<
    Partial<Record<FullTestSectionId, FullTestSectionAttempt>>
  >({});
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [readingPassage, setReadingPassage] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sectionStartTimeRef = useRef(0);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const remainingSeconds = useCountdown(timerSeconds);
  /** Section index already auto-submitted on timeout (prevents repeats). */
  const autoSubmittedSectionRef = useRef<number | null>(null);
  const sectionLoadCancelledRef = useRef(false);
  const submitCancelledRef = useRef(false);
  const [autoSubmitToken, setAutoSubmitToken] = useState(0);

  const section = session?.sections[currentSectionIndex];
  const sectionTitle = sectionTitleOf(section);
  const sectionId = section?.id;
  const totalQuestionsTarget = section?.questionCount ?? 0;
  const sectionIndexRef = useRef(currentSectionIndex);
  const isSubmittingRef = useRef(isSubmitting);
  useEffect(() => {
    sectionIndexRef.current = currentSectionIndex;
    isSubmittingRef.current = isSubmitting;
  }, [currentSectionIndex, isSubmitting]);

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
      sectionStartTimeRef.current = Date.now();

      try {
        const loaded = await fetchSectionBundle(session, nextSection);
        if (sectionLoadCancelledRef.current || submitCancelledRef.current) return;
        setQuestions(loaded.questions);
        setReadingPassage(loaded.readingPassage);
      } catch (err) {
        if (sectionLoadCancelledRef.current || submitCancelledRef.current) return;
        setError(
          err instanceof Error ? err.message : "Failed to load section questions"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [session]
  );

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) return;

    let cancelled = false;
    setIsLoading(true);
    createFullTestSession()
      .then((newSession) => {
        if (cancelled) return;
        setSession(newSession);
      })
      .catch(() => {
        if (cancelled) return;
        setError(null);
        isLocalSessionRef.current = true;
        setSession(createLocalSession(user.uid));
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthLoading, user]);

  useEffect(() => {
    if (!session) return;
    sectionLoadCancelledRef.current = false;
    void loadSection(0);
    return () => {
      sectionLoadCancelledRef.current = true;
    };
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
  const selectedAnswer = selectedChoice(currentQuestion, selectedAnswers);

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

  const handleSubmitSection = useCallback(async () => {
    if (!session || !sectionId) return;

    try {
      setIsSubmitting(true);
      const timeSpentSeconds = Math.floor(
        (Date.now() - sectionStartTimeRef.current) / 1000
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

      if (isLocalSessionRef.current) {
        localAttemptsRef.current = {
          ...localAttemptsRef.current,
          [sectionId]: attemptPayload,
        };
      } else {
        await submitFullTestSection(session.id, sectionId, attemptPayload);
        if (submitCancelledRef.current) return;
      }

      const nextIndex = currentSectionIndex + 1;
      if (nextIndex < session.sections.length) {
        if (submitCancelledRef.current) return;
        setCurrentSectionIndex(nextIndex);
        await loadSection(nextIndex);
        if (submitCancelledRef.current) return;
        return;
      }

      if (isLocalSessionRef.current) {
        const attempts = Object.values({
          ...localAttemptsRef.current,
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
        if (submitCancelledRef.current) return;
      }
      router.push(ROUTES.PRACTICE.FULL_TEST_RESULTS(session.id));
    } catch (err) {
      if (submitCancelledRef.current) return;
      setError(
        err instanceof Error ? err.message : "Failed to submit section answers"
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    currentSectionIndex,
    loadSection,
    questions,
    router,
    sectionId,
    selectedAnswers,
    session,
    totalQuestionsTarget,
    user?.uid,
  ]);

  const submitRef = useRef(handleSubmitSection);
  useEffect(() => {
    submitRef.current = handleSubmitSection;
  }, [handleSubmitSection]);

  useEffect(() => {
    if (remainingSeconds !== 0) return;
    if (isSubmittingRef.current) return;
    if (autoSubmittedSectionRef.current === sectionIndexRef.current) return;
    setAutoSubmitToken((token) => token + 1);
  }, [remainingSeconds]);

  useEffect(() => {
    if (autoSubmitToken === 0) return;
    autoSubmittedSectionRef.current = sectionIndexRef.current;
    submitCancelledRef.current = false;
    void submitRef.current();
    return () => {
      submitCancelledRef.current = true;
    };
  }, [autoSubmitToken]);

  if (isAuthLoading) return <QuestionLoadingSkeleton />;
  if (!user) return <ErrorCard message={signedOutMessage(authIsGuaranteed)} />;
  if (error) return <ErrorCard message={error} />;
  if (isLoading || !section) {
    return <QuestionLoadingSkeleton message={preparingMessage(section)} />;
  }
  if (!session) {
    return <ErrorCard message="Unable to start the full-length test session." />;
  }
  if (!currentQuestion) {
    return <ErrorCard message="No questions found for this section." />;
  }

  return (
    <FullTestScreen
      sectionIndex={currentSectionIndex}
      sectionCount={session.sections.length}
      sectionTitle={sectionTitle}
      sectionId={sectionId}
      totalQuestionsTarget={totalQuestionsTarget}
      currentQuestionIndex={currentQuestionIndex}
      currentQuestion={currentQuestion}
      readingPassage={readingPassage}
      selectedAnswer={selectedAnswer}
      selectedAnswers={selectedAnswers}
      questions={questions}
      showFeedback={showFeedback}
      isCorrect={isCorrect}
      remainingSeconds={remainingSeconds}
      isSubmitting={isSubmitting}
      onSelect={handleAnswerSelect}
      onJump={goToQuestion}
      onCheck={handleCheckAnswer}
      onSubmit={() => void handleSubmitSection()}
    />
  );
}
