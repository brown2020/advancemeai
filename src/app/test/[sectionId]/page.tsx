"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Question as BaseQuestion } from "@/types/question";
import { cn } from "@/utils/cn";
import {
  PageContainer,
  PageHeader,
  SectionContainer,
} from "@/components/common/UIComponents";

/** Extended Question type with section field for test pages */
type Question = BaseQuestion & { section?: string };

export default function TestPage() {
  const params = useParams();
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [difficulty, setDifficulty] = useState(1);
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [previousQuestions, setPreviousQuestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchNextQuestion = useCallback(async () => {
    try {
      setError(null);
      const validSections = ["reading", "writing", "math-calc", "math-no-calc"];
      const section = params.sectionId?.toString();

      if (!section || !validSections.includes(section)) {
        throw new Error("Invalid section type");
      }

      const response = await fetch("/api/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          section: section,
          difficulty,
          previousQuestions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch question");
      }

      const question: Question = await response.json();

      // Question received successfully

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
    } catch (error) {
      // Error already handled by UI state
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
      setCurrentQuestion(null);
    }
  }, [params.sectionId, difficulty, previousQuestions]);

  useEffect(() => {
    if (previousQuestions.length === 0) {
      fetchNextQuestion();
    }
  }, [fetchNextQuestion, previousQuestions.length]);

  const handleAnswerSubmit = () => {
    if (!selectedAnswer || !currentQuestion) return;

    const normalizeAnswer = (answer: string) =>
      answer.replace(/\s+/g, " ").trim();

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
    if (selectedAnswer === currentQuestion?.correctAnswer) {
      setDifficulty((prev) => Math.min(prev + 0.5, 5));
    } else {
      setDifficulty((prev) => Math.max(prev - 0.5, 1));
    }
    setTimeout(() => fetchNextQuestion(), 0);
  };

  if (error) {
    return (
      <PageContainer className="max-w-3xl">
        <PageHeader title="Practice" />
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <h2 className="text-lg font-semibold mb-2 text-foreground">Error</h2>
          <p className="text-sm">{error}</p>
          <Button
            className="mt-4"
            variant="destructive"
            onClick={() => {
              setError(null);
              fetchNextQuestion();
            }}
          >
            Try Again
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (!currentQuestion) {
    return (
      <PageContainer className="max-w-3xl">
        <PageHeader title="Practice" />
        <LoadingSpinner size="large" />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="max-w-3xl">
      <div className="mb-4 flex items-start justify-between gap-4">
        <PageHeader
          title={`${params.sectionId?.toString().toUpperCase()} Practice`}
        />
        <div className="pt-2 text-sm text-muted-foreground">
          Score: {score} · Questions: {questionsAnswered}
        </div>
      </div>

      <SectionContainer>
        <p className="text-lg mb-6">{currentQuestion.text}</p>

        <div className="space-y-3">
          {currentQuestion.options.map((option) => (
            <button
              key={option}
              className={cn(
                "w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                selectedAnswer === option
                  ? "border-ring bg-accent"
                  : "border-border bg-background hover:bg-muted/50",
                showExplanation && "opacity-70"
              )}
              onClick={() => setSelectedAnswer(option)}
              disabled={showExplanation}
              type="button"
            >
              {option.trim()}
            </button>
          ))}
        </div>

        {!showExplanation && selectedAnswer && (
          <Button className="mt-6" size="lg" onClick={handleAnswerSubmit}>
            Submit Answer
          </Button>
        )}

        {showExplanation && (
          <div className="mt-6">
            <div
              className={`p-4 rounded-lg mb-4 ${
                selectedAnswer === currentQuestion.correctAnswer
                  ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-900/25 dark:text-emerald-100"
                  : "bg-red-50 text-red-900 dark:bg-red-900/25 dark:text-red-100"
              }`}
            >
              <p className="font-semibold mb-2">
                {selectedAnswer === currentQuestion.correctAnswer
                  ? "Correct!"
                  : "Incorrect. The correct answer was: " +
                    currentQuestion.correctAnswer}
              </p>
              <p>{currentQuestion.explanation}</p>
            </div>
            <Button size="lg" onClick={handleNextQuestion}>
              Next Question
            </Button>
          </div>
        )}
      </SectionContainer>
    </PageContainer>
  );
}
