"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function NewQuizPage() {
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([
    { text: "", options: ["", "", "", ""], correctAnswer: "" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { text: "", options: ["", "", "", ""], correctAnswer: "" },
    ]);
  };

  const createQuiz = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, questions }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to create quiz");
      }
      router.push("/quizzes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Create a New Quiz</h1>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label className="font-semibold block mb-1">Quiz Title</label>
          <input
            className="border border-gray-300 p-2 rounded-sm w-full"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {questions.map((q, idx) => (
          <div
            key={idx}
            className="border border-gray-200 p-4 rounded-lg space-y-2"
          >
            <label className="font-medium block">Question {idx + 1}:</label>
            <input
              className="border border-gray-300 p-2 rounded-sm w-full"
              placeholder="Question text"
              value={q.text}
              onChange={(e) => {
                const updated = [...questions];
                updated[idx].text = e.target.value;
                setQuestions(updated);
              }}
            />
            <div className="space-y-2">
              {q.options.map((opt, optIdx) => (
                <input
                  key={optIdx}
                  className="border border-gray-300 p-2 rounded-sm w-full"
                  placeholder={`Option ${optIdx + 1}`}
                  value={opt}
                  onChange={(e) => {
                    const updated = [...questions];
                    updated[idx].options[optIdx] = e.target.value;
                    setQuestions(updated);
                  }}
                />
              ))}
            </div>
            <div>
              <label className="mr-2">Correct Answer:</label>
              <select
                value={q.correctAnswer}
                onChange={(e) => {
                  const updated = [...questions];
                  updated[idx].correctAnswer = e.target.value;
                  setQuestions(updated);
                }}
                className="border border-gray-300 p-2 rounded-sm"
              >
                <option value="">Select correct option</option>
                {q.options.map((opt, optIdx) => (
                  <option key={optIdx} value={opt}>
                    {`Option ${optIdx + 1}: ${opt}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}

        <Button onClick={addQuestion} variant="outline">
          Add Question
        </Button>

        <div>
          <Button
            onClick={createQuiz}
            disabled={loading}
            isLoading={loading}
            variant="practice"
          >
            {loading ? "Creating..." : "Create Quiz"}
          </Button>
        </div>
      </div>
    </div>
  );
}
