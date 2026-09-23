"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowRight, CheckCheck, RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Question as BaseQuestion } from "@/types/question";
import {
  ErrorCard,
  QuestionLoadingSkeleton,
} from "@/components/practice/PracticeComponents";
import { TestTopBar } from "@/components/practice/TestTopBar";
import { TestBottomBar } from "@/components/practice/TestBottomBar";
import { QuestionView } from "@/components/practice/QuestionView";
import { AnswerChoices } from "@/components/practice/AnswerChoices";
import { AnswerFeedback } from "@/components/practice/AnswerFeedback";
import { getSectionMeta } from "@/components/practice/sectionMeta";

/** Extended Question type with section field for test pages */
type Question = BaseQuestion & { section?: string };

const VALID_SECTIONS = ["reading", "writing", "math-calc", "math-no-calc"];

const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 5;
const DIFFICULTY_STEP = 0.5;

const normalizeAnswer = (answer: string) => answer.replace(/\s+/g, " ").trim();

export default function TestSectionClient() {
  const params = useParams();
  const section = params.sectionId?.toString();
  const sectionTitle = section ? getSectionMeta(section).title : "Practice";

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [difficulty, setDifficulty] = useState(MIN_DIFFICULTY);
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [previousQuestions, setPreviousQuestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchNextQuestion = useCallback(
    async (requestedDifficulty: number = difficulty) => {
      try {
        setError(null);

        if (!section || !VALID_SECTIONS.includes(section)) {
          throw new Error("Invalid section type");
        }

        const response = await fetch("/api/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            section,
            difficulty: requestedDifficulty,
            previousQuestions,
          }),
        });

        if (!response.ok) {
          const errorData: { message?: string } = await response
            .json()
            .catch(() => ({}));
          throw new Error(errorData.message || "Failed to fetch question");
        }

        const question: Question = await response.json();

        if (!question.section) {
          question.section = section;
        }

        if (question.section !== section) {
          throw new Error(
            `Received question for wrong section: expected ${section}, got ${question.section}`
          );
        }

        setCurrentQuestion(question);
        setSelectedAnswer(null);
        setShowExplanation(false);
        setPreviousQuestions((prev) => [...prev, question.id]);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred"
        );
        setCurrentQuestion(null);
      }
    },
    [section, difficulty, previousQuestions]
  );

  useEffect(() => {
    if (previousQuestions.length === 0) {
      void fetchNextQuestion();
    }
  }, [fetchNextQuestion, previousQuestions.length]);

  const isAnswerCorrect =
    currentQuestion !== null && selectedAnswer === currentQuestion.correctAnswer;

  const handleAnswerSubmit = () => {
    if (!selectedAnswer || !currentQuestion) return;

    const isCorrect =
      normalizeAnswer(selectedAnswer) ===
      normalizeAnswer(currentQuestion.correctAnswer);

    if (isCorrect) {
      setScore((prev) => prev + difficulty);
    }

    setShowExplanation(true);
    setQuestionsAnswered((prev) => prev + 1);
  };

  const handleNextQuestion = () => {
    const nextDifficulty = isAnswerCorrect
      ? Math.min(difficulty + DIFFICULTY_STEP, MAX_DIFFICULTY)
      : Math.max(difficulty - DIFFICULTY_STEP, MIN_DIFFICULTY);
    setDifficulty(nextDifficulty);
    void fetchNextQuestion(nextDifficulty);
  };

  if (error) {
    return (
      <ErrorCard
        message={error}
        action={
          <Button
            type="button"
            onClick={() => {
              setError(null);
              void fetchNextQuestion();
            }}
          >
            <RotateCcw aria-hidden />
            Try again
          </Button>
        }
      />
    );
  }

  if (!currentQuestion) {
    return <QuestionLoadingSkeleton message="Generating your next question..." />;
  }

  return (
    <div className="flex min-h-[calc(100svh-4rem)] flex-col">
      <TestTopBar
        eyebrow="Adaptive practice"
        title={sectionTitle}
        actions={
          <div
            className="hidden items-center gap-3 text-sm tabular-nums text-muted-foreground sm:flex"
            aria-label="Session stats"
          >
            <span className="inline-flex items-center gap-1">
              <Trophy className="size-4 text-streak" aria-hidden />
              <span className="font-semibold text-foreground">{score}</span> pts
            </span>
            <span>{questionsAnswered} answered</span>
          </div>
        }
      />

      <main className="flex-1">
        <QuestionView
          questionNumber={questionsAnswered + (showExplanation ? 0 : 1)}
          questionText={currentQuestion.text}
          headerActions={
            <span className="text-xs font-medium tabular-nums text-muted-foreground sm:hidden">
              {score} pts · {questionsAnswered} answered
            </span>
          }
        >
          <AnswerChoices
            options={currentQuestion.options}
            selected={selectedAnswer}
            onSelect={setSelectedAnswer}
            revealed={showExplanation}
            correctAnswer={currentQuestion.correctAnswer}
          />
          {showExplanation && (
            <AnswerFeedback
              isCorrect={isAnswerCorrect}
              explanation={currentQuestion.explanation}
              correctAnswer={currentQuestion.correctAnswer}
            />
          )}
        </QuestionView>
      </main>

      <TestBottomBar
        status={`Difficulty ${difficulty.toFixed(1)} of ${MAX_DIFFICULTY}`}
      >
        {!showExplanation && (
          <Button
            type="button"
            size="lg"
            onClick={handleAnswerSubmit}
            disabled={!selectedAnswer}
          >
            <CheckCheck aria-hidden />
            Submit answer
          </Button>
        )}
        {showExplanation && (
          <Button type="button" size="lg" onClick={handleNextQuestion}>
            Next question
            <ArrowRight aria-hidden />
          </Button>
        )}
      </TestBottomBar>
    </div>
  );
}
