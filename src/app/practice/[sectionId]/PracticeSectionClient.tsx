"use client";

import { useEffect, useMemo, useState, useReducer} from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle } from "lucide-react";
import type { Question } from "@/types/question";
import { submitTestAttempt } from "@/services/practiceTestService";
import { ROUTES } from "@/constants/appConstants";
import { useAuth } from "@/lib/auth";
import { ExplainMistakeButton } from "@/components/practice/ExplainMistakeButton";
import { BookmarkQuestionButton } from "@/components/practice/BookmarkQuestionButton";
import { StreamingQuestionGenerator } from "@/components/practice/StreamingQuestionGenerator";
import {
  deriveConceptId,
  deriveModeTimer,
  saveAdaptiveAttempt,
} from "@/services/adaptivePracticeService";
import { PracticeMode } from "@/api/firebase/practiceProgressRepository";
import { useAdaptivePractice } from "@/hooks/useAdaptivePractice";
import {
  recordPracticeAnswerResult,
  type PracticeAnswerResults,
} from "@/lib/practice-results";
import {
  SECTION_TITLES,
  TimerDisplay,
  MicroLessonTip,
  QuestionCountSelector,
  GeneratingQuestionsCard,
  QuestionLoadingSkeleton,
  ErrorCard,
  ReadingPassageCard,
  ProgressSummary,
  getRandomMicroLessonTip,
  formatTimer,
} from "@/components/practice/PracticeComponents";

export default function PracticeSectionClient({
  sectionId,
  authIsGuaranteed = false,
}: {
  sectionId: string;
  authIsGuaranteed?: boolean;
}) {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  const sectionTitle = useMemo(
    () => SECTION_TITLES[sectionId] || sectionId,
    [sectionId]
  );

  const [startTime] = useState<number>(() => Date.now());
  const [state, dispatch] = useReducer((s: any, p: Record<string, any>): any => { const patch: Record<string, any> = {}; for (const key of Object.keys(p)) { const value = p[key]; patch[key] = typeof value === "function" ? value(s[key]) : value; } return { ...s, ...patch }; }, { questions: [] as any[], currentQuestionIndex: 0, selectedAnswers: {} as Record<string, any>, isLoading: true, isSubmitting: false, error: null as string | null, showQuestionCountSelector: true, selectedQuestionCount: 1, isGeneratingQuestions: false, readingPassage: null as any, showFeedback: false, isCorrect: null as boolean | null, results: { score: 0, totalAnswered: 0, correctAnswers: [] as any[], answeredQuestionIds: [] as string[] }, practiceMode: "review", questionStartTime: Date.now(), timerSeconds: null as number | null, remainingSeconds: null as number | null, microLessonTip: null as any });
  const { questions, currentQuestionIndex, selectedAnswers, isLoading, isSubmitting, error, showQuestionCountSelector, selectedQuestionCount, isGeneratingQuestions, readingPassage, showFeedback, isCorrect, results, practiceMode, questionStartTime, timerSeconds, remainingSeconds, microLessonTip } = state as any;
  const assignQuestions = (value: any | ((prev: any) => any)) => dispatch({ questions: value });
  const assignCurrentQuestionIndex = (value: any | ((prev: any) => any)) => dispatch({ currentQuestionIndex: value });
  const assignSelectedAnswers = (value: any | ((prev: any) => any)) => dispatch({ selectedAnswers: value });
  const assignIsLoading = (value: any | ((prev: any) => any)) => dispatch({ isLoading: value });
  const assignIsSubmitting = (value: any | ((prev: any) => any)) => dispatch({ isSubmitting: value });
  const assignError = (value: any | ((prev: any) => any)) => dispatch({ error: value });
  const assignShowQuestionCountSelector = (value: any | ((prev: any) => any)) => dispatch({ showQuestionCountSelector: value });
  const assignSelectedQuestionCount = (value: any | ((prev: any) => any)) => dispatch({ selectedQuestionCount: value });
  const assignIsGeneratingQuestions = (value: any | ((prev: any) => any)) => dispatch({ isGeneratingQuestions: value });
  const assignReadingPassage = (value: any | ((prev: any) => any)) => dispatch({ readingPassage: value });
  const assignShowFeedback = (value: any | ((prev: any) => any)) => dispatch({ showFeedback: value });
  const assignIsCorrect = (value: any | ((prev: any) => any)) => dispatch({ isCorrect: value });
  const assignResults = (value: any | ((prev: any) => any)) => dispatch({ results: value });
  const assignPracticeMode = (value: any | ((prev: any) => any)) => dispatch({ practiceMode: value });
  const assignQuestionStartTime = (value: any | ((prev: any) => any)) => dispatch({ questionStartTime: value });
  const assignTimerSeconds = (value: any | ((prev: any) => any)) => dispatch({ timerSeconds: value });
  const assignRemainingSeconds = (value: any | ((prev: any) => any)) => dispatch({ remainingSeconds: value });
  const assignMicroLessonTip = (value: any | ((prev: any) => any)) => dispatch({ microLessonTip: value });

  const { recommendation } = useAdaptivePractice(user?.uid, sectionId);

  useEffect(() => {
    assignQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  useEffect(() => {
    if (timerSeconds === null) {
      assignRemainingSeconds(null);
      return;
    }
    assignRemainingSeconds(timerSeconds);
    const interval = setInterval(() => {
      assignRemainingSeconds((prev) => {
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

  const handleStartPractice = async () => {
    assignShowQuestionCountSelector(false);
    assignIsGeneratingQuestions(true);
    assignQuestionStartTime(Date.now());
    assignMicroLessonTip(
      practiceMode === "micro" ? getRandomMicroLessonTip(sectionId) : null
    );
    const modeTimer = deriveModeTimer(practiceMode, selectedQuestionCount);
    assignTimerSeconds(modeTimer);

    try {
      const url = `/api/questions/${sectionId}?count=${selectedQuestionCount}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch questions for section ${sectionId}`);
      }

      const data = await response.json();

      // Normalize response and enforce the requested count.
      const nextQuestions: Question[] = Array.isArray(data?.questions)
        ? data.questions
        : Array.isArray(data)
          ? data
          : [];
      assignQuestions(nextQuestions.slice(0, selectedQuestionCount));
      assignCurrentQuestionIndex(0);
      assignSelectedAnswers({});
      assignShowFeedback(false);
      assignIsCorrect(null);

      if (data.readingPassage && sectionId === "reading") {
        assignReadingPassage(data.readingPassage);
      }

      assignError(null);
    } catch {
      assignError("Failed to load questions. Please try again later.");
    } finally {
      assignIsGeneratingQuestions(false);
      assignIsLoading(false);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  const handlePrevious = () => {
    assignShowFeedback(false);
    if (currentQuestionIndex > 0) {
      assignCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    assignShowFeedback(false);
    if (currentQuestionIndex < questions.length - 1) {
      assignCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleAnswerSelect = (value: string) => {
    if (!currentQuestion) return;

    assignSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion.id]: value,
    });
    assignShowFeedback(false);
  };

  const checkAnswer = () => {
    if (!currentQuestion || !selectedAnswers[currentQuestion.id]) return;

    const isAnswerCorrect =
      selectedAnswers[currentQuestion.id] === currentQuestion.correctAnswer;
    assignIsCorrect(isAnswerCorrect);
    assignShowFeedback(true);

    const timeSpentMs = Date.now() - questionStartTime;
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
    assignQuestionStartTime(Date.now());

    assignResults((prev) =>
      recordPracticeAnswerResult(prev, currentQuestion.id, isAnswerCorrect)
    );
  };

  const handleSubmit = async () => {
    if (!user) return;

    try {
      assignIsSubmitting(true);
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
      const finalScore = Math.min(results.score, totalQuestions);

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
      assignError("Failed to submit your answers. Please try again.");
    } finally {
      assignIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (practiceMode !== "timed") return;
    if (remainingSeconds === 0) {
      handleSubmit();
    }
  }, [remainingSeconds, practiceMode]);

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
              ? "Your session expired. Please sign in again to access practice tests."
              : "You must be logged in to access practice tests."
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

  if (showQuestionCountSelector) {
    return (
      <div className="container mx-auto p-4">
        <QuestionCountSelector
          selectedCount={selectedQuestionCount}
          onCountChange={assignSelectedQuestionCount}
          practiceMode={practiceMode}
          onModeChange={assignPracticeMode}
          sectionTitle={sectionTitle}
          recommendation={recommendation}
          onStart={handleStartPractice}
        />
      </div>
    );
  }

  if (isGeneratingQuestions) {
    return (
      <div className="container mx-auto p-4">
        <GeneratingQuestionsCard
          selectedCount={selectedQuestionCount}
          sectionTitle={sectionTitle}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <QuestionLoadingSkeleton />
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="container mx-auto p-4">
        <ErrorCard message="No questions found for this section." />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 space-y-3">
        {practiceMode === "timed" && (
          <TimerDisplay formattedTimer={formattedTimer} />
        )}
        {practiceMode === "micro" && <MicroLessonTip tip={microLessonTip} />}
        {currentQuestionIndex === questions.length - 1 && (
          <StreamingQuestionGenerator
            sectionId={sectionId}
            readingPassage={readingPassage ?? undefined}
            onQuestion={(question) => {
              assignShowFeedback(false);
              assignIsCorrect(null);
              assignQuestions((prev) => [...prev, question]);
              assignCurrentQuestionIndex((prev) => prev + 1);
            }}
            difficulty={recommendation?.suggestedDifficulty ?? "medium"}
          />
        )}
      </div>

      {readingPassage && sectionId === "reading" && (
        <ReadingPassageCard passage={readingPassage} />
      )}

      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle>
              Question {currentQuestionIndex + 1} of {questions.length}
            </CardTitle>
            <BookmarkQuestionButton
              questionId={currentQuestion.id}
              questionText={currentQuestion.text}
              correctAnswer={currentQuestion.correctAnswer}
              sectionId={sectionId}
            />
          </div>
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
            {currentQuestion.options.map((option, rowNo) => (
              <div
                key={rowNo}
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
                  id={`option-${rowNo}`}
                  disabled={showFeedback}
                />
                <Label htmlFor={`option-${rowNo}`} className="flex-grow">
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
                  {!isCorrect && (
                    <div className="mt-3">
                      <ExplainMistakeButton
                        question={currentQuestion.text}
                        userAnswer={selectedAnswers[currentQuestion.id] ?? ""}
                        correctAnswer={currentQuestion.correctAnswer}
                        sectionId={sectionId}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <ProgressSummary
            answeredCount={Object.keys(selectedAnswers).length}
            totalQuestions={questions.length}
            score={results.score}
          />
        </CardContent>
        <CardFooter className="flex justify-between">
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
              disabled={currentQuestionIndex === questions.length - 1}
              variant="outline"
            >
              Next
            </Button>
          </div>
          <div>
            {!showFeedback && selectedAnswers[currentQuestion.id] && (
              <Button onClick={checkAnswer} className="mr-2">
                Check Answer
              </Button>
            )}
            {Object.keys(selectedAnswers).length === questions.length && (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit All Answers"}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
