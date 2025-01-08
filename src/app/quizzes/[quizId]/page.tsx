"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";

type Quiz = {
  id: string;
  title: string;
  questions: {
    text: string;
    options: string[];
    correctAnswer: string;
  }[];
};

export default function QuizDetailPage() {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, string>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const params = useParams();
  const quizId = params.quizId as string;

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch(`/api/quizzes/${quizId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch quiz");
        }
        const data = await response.json();
        setQuiz(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error");
      }
    };
    fetchQuiz();
  }, [quizId]);

  const handleSelectAnswer = (questionIndex: number, answer: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: answer,
    }));
  };

  const handleSubmit = () => {
    // Simplified check
    setIsSubmitting(true);

    // You might show correct/incorrect answers here or store results
    setTimeout(() => {
      setIsSubmitting(false);
      setQuizCompleted(true);
    }, 1000);
  };

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">{error}</p>
        <button
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => router.push("/quizzes")}
        >
          Back to Quizzes
        </button>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="p-6 text-center">
        <p>Loading quiz...</p>
      </div>
    );
  }

  if (quizCompleted) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Quiz Completed</h2>
        <p>Thanks for taking the quiz. You could display a score here.</p>
        <button
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => router.push("/quizzes")}
        >
          Back to Quizzes
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">{quiz.title}</h1>
      {quiz.questions.map((question, idx) => (
        <div key={idx} className="mb-6">
          <p className="text-lg font-semibold mb-2">
            Question {idx + 1}: {question.text}
          </p>
          {question.options.map((option, optIdx) => (
            <button
              key={optIdx}
              onClick={() => handleSelectAnswer(idx, option)}
              className={`block w-full text-left p-3 border mb-2 rounded ${
                selectedAnswers[idx] === option
                  ? "bg-blue-50 border-blue-400"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      ))}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
      >
        {isSubmitting ? "Submitting..." : "Submit Quiz"}
      </button>
    </div>
  );
}
