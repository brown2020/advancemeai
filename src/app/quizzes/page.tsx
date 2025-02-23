"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Quiz = {
  id: string;
  title: string;
  questions: {
    text: string;
    options: string[];
    correctAnswer: string;
  }[];
};

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/quizzes");
        if (!response.ok) {
          throw new Error("Failed to fetch quizzes");
        }
        const data = await response.json();
        setQuizzes(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unexpected error");
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Quiz Library</h1>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      {loading ? (
        <div>Loading quizzes...</div>
      ) : (
        <>
          <div className="mb-4 flex justify-end">
            <Link
              href="/quizzes/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700"
            >
              Create New Quiz
            </Link>
          </div>
          {quizzes.length === 0 && <div>No quizzes available.</div>}
          <ul className="space-y-4">
            {quizzes.map((quiz) => (
              <li
                key={quiz.id}
                className="p-4 rounded-lg border border-gray-200 hover:shadow-xs transition"
              >
                <div className="font-bold text-lg mb-2">{quiz.title}</div>
                <p className="text-gray-600 mb-2">
                  Questions: {quiz.questions.length}
                </p>
                <Link
                  href={`/quizzes/${quiz.id}`}
                  className="px-3 py-1 bg-blue-500 text-white rounded-sm hover:bg-blue-600"
                >
                  Take Quiz
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
