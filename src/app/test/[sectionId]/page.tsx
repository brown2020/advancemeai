"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  difficulty: number;
  explanation: string;
  section: string;
}

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
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Error</h2>
          <p>{error}</p>
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
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {params.sectionId?.toString().toUpperCase()} Practice
        </h1>
        <div className="text-gray-600 dark:text-gray-300">
          Score: {score} | Questions: {questionsAnswered}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xs mb-6">
        <p className="text-lg mb-6 text-gray-900 dark:text-white">
          {currentQuestion.text}
        </p>

        <div className="space-y-3">
          {currentQuestion.options.map((option) => (
            <button
              key={option}
              className={`w-full p-4 text-left rounded-lg transition-colors ${
                selectedAnswer === option
                  ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500"
                  : "border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
              onClick={() => setSelectedAnswer(option)}
              disabled={showExplanation}
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
                  ? "bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                  : "bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200"
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
      </div>
    </div>
  );
}
