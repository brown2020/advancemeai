"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Question } from "@/types/question";
import { submitTestAttempt } from "@/services/practiceTestService";
import { ROUTES, SECTION_TITLES } from "@/constants/appConstants";
import { useAuth } from "@/lib/auth";
import {
  deriveConceptId,
  deriveModeTimer,
  saveAdaptiveAttempt,
} from "@/services/adaptivePracticeService";
import type { PracticeMode } from "@/api/firebase/practiceProgressRepository";
import { useAdaptivePractice } from "@/hooks/useAdaptivePractice";
import { answerMatchesQuestion, gradeSectionAnswers } from "@/lib/grade-section";
import {
  recordPracticeAnswerResult,
  type PracticeAnswerResults,
} from "@/lib/practice-results";
import {
  GeneratingQuestionsCard,
  QuestionLoadingSkeleton,
  ErrorCard,
} from "@/components/practice/PracticeComponents";
import { getRandomMicroLessonTip } from "@/components/practice/practice-helpers";
import { PracticeSetup } from "@/components/practice/PracticeSetup";
import { PracticeQuestionScreen } from "@/components/practice/PracticeQuestionScreen";
import { useCountdown } from "@/components/practice/useCountdown";

const INITIAL_RESULTS: PracticeAnswerResults = {
  score: 0,
  totalAnswered: 0,
  correctAnswers: [],
  answeredQuestionIds: [],
};

function rememberCheckedResult(
  ref: { current: PracticeAnswerResults },
  questionId: string,
  isCorrect: boolean
): PracticeAnswerResults {
  const next = recordPracticeAnswerResult(ref.current, questionId, isCorrect);
  ref.current = next;
  return next;
}

type QuestionsResponse = {
  questions?: Question[];
  readingPassage?: string | null;
};

export default function PracticeSectionClient({
  sectionId,
  authIsGuaranteed = false,
}: {
  sectionId: string;
  authIsGuaranteed?: boolean;
}) {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const sectionTitle = SECTION_TITLES[sectionId] || sectionId;
  const [startTime] = useState<number>(() => Date.now());
  const questionStartTimeRef = useRef(0);

  const [showQuestionCountSelector, setShowQuestionCountSelector] =
    useState(true);
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(1);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("review");
  const [microLessonTip, setMicroLessonTip] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);

  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [readingPassage, setReadingPassage] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, string>
  >({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [results, setResults] = useState<PracticeAnswerResults>(INITIAL_RESULTS);
  const resultsRef = useRef(INITIAL_RESULTS);

  const remainingSeconds = useCountdown(timerSeconds);
  const { recommendation } = useAdaptivePractice(user?.uid, sectionId);

  useEffect(() => {
    questionStartTimeRef.current = Date.now();
  }, [currentQuestionIndex]);

  const handleStartPractice = async () => {
    setShowQuestionCountSelector(false);
    setIsGeneratingQuestions(true);
    questionStartTimeRef.current = Date.now();
    setMicroLessonTip(
      practiceMode === "micro" ? getRandomMicroLessonTip(sectionId) : null
    );
    setTimerSeconds(deriveModeTimer(practiceMode, selectedQuestionCount));

    try {
      const url = `/api/questions/${sectionId}?count=${selectedQuestionCount}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch questions for section ${sectionId}`);
      }

      const data = (await response.json()) as QuestionsResponse | Question[];

      // Normalize response and enforce the requested count.
      const nextQuestions: Question[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.questions)
          ? data.questions
          : [];
      setQuestions(nextQuestions.slice(0, selectedQuestionCount));
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setShowFeedback(false);
      setIsCorrect(null);

      if (!Array.isArray(data) && data.readingPassage && sectionId === "reading") {
        setReadingPassage(data.readingPassage);
      }

      setError(null);
    } catch {
      setError("Failed to load questions. Please try again later.");
    } finally {
      setIsGeneratingQuestions(false);
      setIsLoading(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const selectedAnswer = currentQuestion
    ? selectedAnswers[currentQuestion.id]
    : undefined;
  const answeredCount = Object.keys(selectedAnswers).length;

  const handlePrevious = () => {
    setShowFeedback(false);
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    setShowFeedback(false);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleAnswerSelect = (value: string) => {
    if (!currentQuestion) return;
    setSelectedAnswers({ ...selectedAnswers, [currentQuestion.id]: value });
    setShowFeedback(false);
  };

  const checkAnswer = () => {
    if (!currentQuestion || !selectedAnswer) return;

    const isAnswerCorrect = answerMatchesQuestion(currentQuestion, selectedAnswer);
    setIsCorrect(isAnswerCorrect);
    setShowFeedback(true);

    const timeSpentMs = Date.now() - (questionStartTimeRef.current ?? Date.now());
    if (user) {
      saveAdaptiveAttempt({
        userId: user.uid,
        sectionId,
        questionId: currentQuestion.id,
        mode: practiceMode,
        isCorrect: isAnswerCorrect,
        timeSpentMs,
        difficulty: currentQuestion.difficulty,
        conceptId: deriveConceptId(currentQuestion),
      }).catch(() => {
        // silent failure (background save)
      });
    }
    questionStartTimeRef.current = Date.now();

    setResults(
      rememberCheckedResult(resultsRef, currentQuestion.id, isAnswerCorrect)
    );
  };

  const handleSubmit = async () => {
    if (!user) return;

    try {
      setIsSubmitting(true);
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);

      const questionsData = questions.map((q) => ({
        id: q.id,
        text: q.text,
        correctAnswer: q.correctAnswer,
        options: q.options,
        explanation: q.explanation,
      }));

      localStorage.setItem(
        `questions-${sectionId}-${Date.now()}`,
        JSON.stringify(questionsData)
      );

      const totalQuestions = questions.length;
      const finalScore = gradeSectionAnswers(questions, selectedAnswers).score;

      const response = await submitTestAttempt({
        userId: user.uid,
        sectionId,
        answers: selectedAnswers,
        timeSpent,
        completedAt: new Date(),
        score: finalScore,
        totalQuestions,
        questionsData,
      });

      router.push(ROUTES.PRACTICE.RESULTS(response.id));
    } catch {
      setError("Failed to submit your answers. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const timedSubmitRef = useRef({
    user,
    sectionId,
    selectedAnswers,
    startTime,
    questions,
    router,
  });
  useEffect(() => {
    timedSubmitRef.current = {
      user,
      sectionId,
      selectedAnswers,
      startTime,
      questions,
      router,
    };
  }, [questions, router, sectionId, selectedAnswers, startTime, user]);

  useEffect(() => {
    if (practiceMode !== "timed" || remainingSeconds !== 0) return;
    let cancelled = false;

    const submit = () => {
      const current = timedSubmitRef.current;
      if (!current.user) return;
      setIsSubmitting(true);
      const timeSpent = Math.floor((Date.now() - current.startTime) / 1000);
      const questionsData = current.questions.map((q) => ({
        id: q.id,
        text: q.text,
        correctAnswer: q.correctAnswer,
        options: q.options,
        explanation: q.explanation,
      }));
      localStorage.setItem(
        `questions-${current.sectionId}-${Date.now()}`,
        JSON.stringify(questionsData)
      );
      const totalQuestions = current.questions.length;
      submitTestAttempt({
        userId: current.user.uid,
        sectionId: current.sectionId,
        answers: current.selectedAnswers,
        timeSpent,
        completedAt: new Date(),
        score: gradeSectionAnswers(current.questions, current.selectedAnswers).score,
        totalQuestions,
        questionsData,
      }).then(
        (response) => {
          if (cancelled) return;
          setIsSubmitting(false);
          current.router.push(ROUTES.PRACTICE.RESULTS(response.id));
        },
        () => {
          if (cancelled) return;
          setError("Failed to submit your answers. Please try again.");
          setIsSubmitting(false);
        }
      );
    };

    void submit();
    return () => {
      cancelled = true;
    };
  }, [remainingSeconds, practiceMode]);

  return (
    <PracticeSectionStage
      isAuthLoading={isAuthLoading}
      hasUser={Boolean(user)}
      authIsGuaranteed={authIsGuaranteed}
      error={error}
      showQuestionCountSelector={showQuestionCountSelector}
      sectionTitle={sectionTitle}
      selectedQuestionCount={selectedQuestionCount}
      onCountChange={setSelectedQuestionCount}
      practiceMode={practiceMode}
      onModeChange={setPracticeMode}
      recommendation={recommendation}
      onStart={handleStartPractice}
      isGeneratingQuestions={isGeneratingQuestions}
      isLoading={isLoading}
      currentQuestion={currentQuestion}
      sectionId={sectionId}
      questionIndex={currentQuestionIndex}
      totalQuestions={questions.length}
      remainingSeconds={remainingSeconds}
      readingPassage={readingPassage}
      microLessonTip={microLessonTip}
      selectedAnswer={selectedAnswer}
      showFeedback={showFeedback}
      isCorrect={isCorrect}
      answeredCount={answeredCount}
      score={results.score}
      isSubmitting={isSubmitting}
      suggestedDifficulty={recommendation?.suggestedDifficulty ?? "medium"}
      onSelect={handleAnswerSelect}
      onBack={handlePrevious}
      onNext={handleNext}
      onCheck={checkAnswer}
      onSubmit={handleSubmit}
      onGeneratedQuestion={(question) => {
        setShowFeedback(false);
        setIsCorrect(null);
        setQuestions((prev) => [...prev, question]);
        setCurrentQuestionIndex((prev) => prev + 1);
      }}
    />
  );
}

function PracticeSectionStage({
  isAuthLoading,
  hasUser,
  authIsGuaranteed,
  error,
  showQuestionCountSelector,
  sectionTitle,
  selectedQuestionCount,
  onCountChange,
  practiceMode,
  onModeChange,
  recommendation,
  onStart,
  isGeneratingQuestions,
  isLoading,
  currentQuestion,
  sectionId,
  questionIndex,
  totalQuestions,
  remainingSeconds,
  readingPassage,
  microLessonTip,
  selectedAnswer,
  showFeedback,
  isCorrect,
  answeredCount,
  score,
  isSubmitting,
  suggestedDifficulty,
  onSelect,
  onBack,
  onNext,
  onCheck,
  onSubmit,
  onGeneratedQuestion,
}: {
  isAuthLoading: boolean;
  hasUser: boolean;
  authIsGuaranteed: boolean;
  error: string | null;
  showQuestionCountSelector: boolean;
  sectionTitle: string;
  selectedQuestionCount: number;
  onCountChange: (count: number) => void;
  practiceMode: PracticeMode;
  onModeChange: (mode: PracticeMode) => void;
  recommendation: ReturnType<typeof useAdaptivePractice>["recommendation"];
  onStart: () => void;
  isGeneratingQuestions: boolean;
  isLoading: boolean;
  currentQuestion: Question | undefined;
  sectionId: string;
  questionIndex: number;
  totalQuestions: number;
  remainingSeconds: number | null;
  readingPassage: string | null;
  microLessonTip: string | null;
  selectedAnswer: string | undefined;
  showFeedback: boolean;
  isCorrect: boolean | null;
  answeredCount: number;
  score: number;
  isSubmitting: boolean;
  suggestedDifficulty: string;
  onSelect: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
  onCheck: () => void;
  onSubmit: () => void;
  onGeneratedQuestion: (question: Question) => void;
}) {
  if (isAuthLoading) return <QuestionLoadingSkeleton />;
  if (!hasUser) {
    return (
      <ErrorCard
        message={
          authIsGuaranteed
            ? "Your session expired. Please sign in again to access practice tests."
            : "You must be logged in to access practice tests."
        }
      />
    );
  }
  if (error) return <ErrorCard message={error} />;
  if (showQuestionCountSelector) {
    return (
      <PracticeSetup
        sectionTitle={sectionTitle}
        selectedCount={selectedQuestionCount}
        onCountChange={onCountChange}
        practiceMode={practiceMode}
        onModeChange={onModeChange}
        recommendation={recommendation}
        onStart={onStart}
      />
    );
  }
  if (isGeneratingQuestions) {
    return (
      <GeneratingQuestionsCard
        selectedCount={selectedQuestionCount}
        sectionTitle={sectionTitle}
      />
    );
  }
  if (isLoading) return <QuestionLoadingSkeleton />;
  if (!currentQuestion) return <ErrorCard message="No questions found for this section." />;

  return (
    <PracticeQuestionScreen
      sectionId={sectionId}
      sectionTitle={sectionTitle}
      practiceMode={practiceMode}
      question={currentQuestion}
      questionIndex={questionIndex}
      totalQuestions={totalQuestions}
      remainingSeconds={remainingSeconds}
      readingPassage={readingPassage}
      microLessonTip={microLessonTip}
      selectedAnswer={selectedAnswer}
      showFeedback={showFeedback}
      isCorrect={isCorrect}
      answeredCount={answeredCount}
      score={score}
      isSubmitting={isSubmitting}
      suggestedDifficulty={suggestedDifficulty}
      onSelect={onSelect}
      onBack={onBack}
      onNext={onNext}
      onCheck={onCheck}
      onSubmit={onSubmit}
      onGeneratedQuestion={onGeneratedQuestion}
    />
  );
}
