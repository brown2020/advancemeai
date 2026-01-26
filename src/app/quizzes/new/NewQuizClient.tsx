"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ErrorDisplay,
  PageContainer,
  PageHeader,
  SectionContainer,
  LoadingState,
} from "@/components/common/UIComponents";
import { FormField, TextInput } from "@/components/common/FormComponents";
import { useAuth } from "@/lib/auth";
import { SignInGate, SignInGateIcons } from "@/components/auth/SignInGate";

export default function NewQuizClient() {
  const { user, isLoading: isAuthLoading } = useAuth();
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

  if (isAuthLoading) {
    return (
      <PageContainer className="max-w-4xl">
        <PageHeader title="Create a New Quiz" />
        <LoadingState message="Checking your session..." />
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer className="max-w-4xl">
        <PageHeader title="Create a New Quiz" />
        <SignInGate
          title="Sign in to create Quizzes"
          description="Create quizzes to test your knowledge and track progress."
          icon={SignInGateIcons.quiz}
          buttonStyle="quiz"
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="max-w-4xl">
      <PageHeader title="Create a New Quiz" />
      {error && <ErrorDisplay message={error} />}

      <div className="space-y-6">
        <SectionContainer title="Quiz details">
          <FormField label="Quiz title" required>
            <TextInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Algebra fundamentals"
              required
            />
          </FormField>
        </SectionContainer>

        {questions.map((q, idx) => (
          <SectionContainer key={idx} title={`Question ${idx + 1}`}>
            <div className="space-y-4">
              <FormField label="Prompt" required>
                <TextInput
                  placeholder="Question text"
                  value={q.text}
                  onChange={(e) => {
                    const updated = [...questions];
                    const question = updated[idx];
                    if (question) {
                      question.text = e.target.value;
                      setQuestions(updated);
                    }
                  }}
                  required
                />
              </FormField>

              <div className="space-y-2">
                <p className="text-sm font-medium">Options</p>
                {q.options.map((opt, optIdx) => (
                  <TextInput
                    key={optIdx}
                    placeholder={`Option ${optIdx + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const updated = [...questions];
                      const question = updated[idx];
                      const option = question?.options[optIdx];
                      if (question && option !== undefined) {
                        question.options[optIdx] = e.target.value;
                        setQuestions(updated);
                      }
                    }}
                  />
                ))}
              </div>

              <FormField label="Correct answer" required>
                <select
                  value={q.correctAnswer}
                  onChange={(e) => {
                    const updated = [...questions];
                    const question = updated[idx];
                    if (question) {
                      question.correctAnswer = e.target.value;
                      setQuestions(updated);
                    }
                  }}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  required
                >
                  <option value="">Select correct option</option>
                  {q.options.map((opt, optIdx) => (
                    <option key={optIdx} value={opt}>
                      {`Option ${optIdx + 1}${opt ? `: ${opt}` : ""}`}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
          </SectionContainer>
        ))}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button onClick={addQuestion} variant="outline">
            Add Question
          </Button>

          <Button onClick={createQuiz} disabled={loading} isLoading={loading}>
            {loading ? "Creating..." : "Create Quiz"}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}

