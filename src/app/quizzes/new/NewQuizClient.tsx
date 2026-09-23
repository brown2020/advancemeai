"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Globe, Lock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ErrorDisplay,
  LoadingState,
  PageContainer,
  PageHeader,
} from "@/components/common/UIComponents";
import { FormField } from "@/components/common/FormComponents";
import { useAuth } from "@/lib/auth";
import { SignInGate, SignInGateIcons } from "@/components/auth/SignInGate";
import {
  QuizQuestionEditor,
  type QuestionDraft,
} from "@/components/quizzes/QuizQuestionEditor";
import { ROUTES } from "@/constants/appConstants";
import { cn } from "@/utils/cn";

const OPTION_COUNT = 4;

function emptyQuestion(id: number): QuestionDraft {
  return { id, text: "", options: Array(OPTION_COUNT).fill(""), correctIndex: null };
}

/** Returns a user-facing problem with the draft, or null when it can be submitted. */
function validateDraft(title: string, questions: QuestionDraft[]): string | null {
  if (!title.trim()) return "Give your quiz a title.";
  for (const [i, q] of questions.entries()) {
    if (!q.text.trim()) return `Question ${i + 1} needs a prompt.`;
    if (q.options.filter((o) => o.trim()).length < 2) {
      return `Question ${i + 1} needs at least two answer choices.`;
    }
    const correct = q.correctIndex === null ? "" : q.options[q.correctIndex] ?? "";
    if (!correct.trim()) return `Pick the correct answer for question ${i + 1}.`;
  }
  return null;
}

export default function NewQuizClient() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const nextId = useRef(1);

  const [title, setTitle] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [questions, setQuestions] = useState<QuestionDraft[]>(() => [emptyQuestion(0)]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const addQuestion = () => {
    const id = nextId.current++;
    setQuestions((prev) => [...prev, emptyQuestion(id)]);
  };

  const updateQuestion = (next: QuestionDraft) => {
    setQuestions((prev) => prev.map((q) => (q.id === next.id ? next : q)));
  };

  const removeQuestion = (id: number) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const createQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validateDraft(title, questions);
    if (problem) {
      setError(problem);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload = questions.map((q) => ({
        text: q.text,
        options: q.options,
        correctAnswer: q.correctIndex === null ? "" : q.options[q.correctIndex] ?? "",
      }));

      const response = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, questions: payload, isPublic }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to create quiz");
      }
      router.push(ROUTES.QUIZZES.INDEX);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <PageContainer width="narrow">
        <PageHeader title="New quiz" />
        <LoadingState message="Checking your session..." />
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer width="narrow">
        <PageHeader title="New quiz" />
        <SignInGate
          title="Sign in to create Quizzes"
          description="Create quizzes to test your knowledge and track progress."
          icon={SignInGateIcons.quiz}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer width="narrow">
      <Link
        href={ROUTES.QUIZZES.INDEX}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Quizzes
      </Link>
      <PageHeader
        title="New quiz"
        description="Write multiple-choice questions and mark the right answer for each."
      />

      <form onSubmit={createQuiz} className="space-y-4" noValidate>
        <Card className="p-5 sm:p-6">
          <FormField label="Title" htmlFor="quiz-title" required>
            <Input
              id="quiz-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Algebra fundamentals"
              className="h-12 text-base"
              required
            />
          </FormField>

          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold">Who can take it</legend>
            <div role="radiogroup" aria-label="Who can take it" className="grid gap-2 sm:grid-cols-2">
              <VisibilityOption
                selected={!isPublic}
                onSelect={() => setIsPublic(false)}
                icon={<Lock className="size-4" aria-hidden />}
                title="Only me"
                description="Private to your account"
              />
              <VisibilityOption
                selected={isPublic}
                onSelect={() => setIsPublic(true)}
                icon={<Globe className="size-4" aria-hidden />}
                title="Everyone"
                description="Listed under public quizzes"
              />
            </div>
          </fieldset>
        </Card>

        {questions.map((q, index) => (
          <QuizQuestionEditor
            key={q.id}
            question={q}
            number={index + 1}
            canRemove={questions.length > 1}
            onChange={updateQuestion}
            onRemove={() => removeQuestion(q.id)}
          />
        ))}

        <button
          type="button"
          onClick={addQuestion}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="size-4" aria-hidden />
          Add question
        </button>

        {error && <ErrorDisplay message={error} className="mb-0" />}

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-center text-sm text-muted-foreground sm:text-left">
            {questions.length} question{questions.length === 1 ? "" : "s"}
          </p>
          <Button type="submit" size="lg" isLoading={loading}>
            {loading ? "Creating..." : "Create quiz"}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}

function VisibilityOption({
  selected,
  onSelect,
  icon,
  title,
  description,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex items-start gap-3 rounded-xl border p-3 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary bg-accent"
          : "border-input bg-card hover:border-primary/40"
      )}
    >
      <span
        className={cn(
          "mt-0.5",
          selected ? "text-primary" : "text-muted-foreground"
        )}
      >
        {icon}
      </span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
    </button>
  );
}
