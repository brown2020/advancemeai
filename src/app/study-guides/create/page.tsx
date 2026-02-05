"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { createFlashcardSet } from "@/services/flashcardService";
import type { StudyGuide } from "@/types/study-guide";
import { cn } from "@/utils/cn";

type ContentType = "text" | "notes" | "transcript" | "article";

const CONTENT_TYPES: {
  value: ContentType;
  label: string;
  description: string;
}[] = [
  { value: "text", label: "Text", description: "General text content" },
  { value: "notes", label: "Notes", description: "Class or lecture notes" },
  {
    value: "transcript",
    label: "Transcript",
    description: "Video or audio transcript",
  },
  {
    value: "article",
    label: "Article",
    description: "Article or chapter text",
  },
];

export default function CreateStudyGuidePage() {
  const { user, isLoading: authLoading } = useAuth();

  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState<ContentType>("text");
  const [subject, setSubject] = useState("");
  const [generateFlashcards, setGenerateFlashcards] = useState(true);
  const [generateQuestions, setGenerateQuestions] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedGuide, setGeneratedGuide] = useState<StudyGuide | null>(null);
  const [isSavingFlashcards, setIsSavingFlashcards] = useState(false);
  const [flashcardsSaved, setFlashcardsSaved] = useState(false);

  const handleGenerate = async () => {
    if (!content.trim() || content.length < 100) {
      setError("Please enter at least 100 characters of content");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/study-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          title: title.trim() || undefined,
          contentType,
          subject: subject.trim() || undefined,
          generateFlashcards,
          generateQuestions,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate study guide");
      }

      const data = await response.json();
      setGeneratedGuide(data.studyGuide);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveFlashcards = async () => {
    if (!generatedGuide?.flashcards || !user) return;

    setIsSavingFlashcards(true);
    try {
      const cards = generatedGuide.flashcards.map(
        (fc: { term: string; definition: string }) => ({
          term: fc.term,
          definition: fc.definition,
        })
      );

      await createFlashcardSet(
        user.uid,
        `${generatedGuide.title} - Flashcards`,
        `Generated from study guide: ${generatedGuide.title}`,
        cards,
        false
      );

      setFlashcardsSaved(true);
    } catch (err) {
      setError("Failed to save flashcards");
    } finally {
      setIsSavingFlashcards(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Sign in Required</h1>
          <p className="text-muted-foreground mb-6">
            Please sign in to create study guides.
          </p>
          <Link href="/auth/signin?returnTo=/study-guides/create">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Show generated guide
  if (generatedGuide) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/study-guides/create"
          onClick={(e) => {
            e.preventDefault();
            setGeneratedGuide(null);
            setFlashcardsSaved(false);
          }}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Create Another
        </Link>

        <div className="mb-8">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{generatedGuide.title}</h1>
              <p className="text-muted-foreground">AI-generated study guide</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Summary */}
          <section className="rounded-xl border bg-card p-6">
            <h2 className="text-lg font-semibold mb-3">Summary</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {generatedGuide.summary}
            </p>
          </section>

          {/* Sections */}
          {generatedGuide.sections?.map(
            (
              section: { title: string; content: string; keyPoints?: string[] },
              idx: number
            ) => (
              <section key={idx} className="rounded-xl border bg-card p-6">
                <h2 className="text-lg font-semibold mb-3">{section.title}</h2>
                <p className="text-muted-foreground mb-4">{section.content}</p>
                {section.keyPoints && section.keyPoints.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Key Points</h3>
                    <ul className="space-y-1">
                      {section.keyPoints.map((point: string, i: number) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <span className="text-primary">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )
          )}

          {/* Flashcards */}
          {generatedGuide.flashcards &&
            generatedGuide.flashcards.length > 0 && (
              <section className="rounded-xl border bg-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">
                    Flashcards ({generatedGuide.flashcards.length})
                  </h2>
                  <Button
                    onClick={handleSaveFlashcards}
                    disabled={isSavingFlashcards || flashcardsSaved}
                    size="sm"
                  >
                    {flashcardsSaved ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Saved
                      </>
                    ) : isSavingFlashcards ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Save to My Sets
                      </>
                    )}
                  </Button>
                </div>
                <div className="grid gap-3">
                  {generatedGuide.flashcards.map(
                    (fc: { term: string; definition: string }, idx: number) => (
                      <div
                        key={idx}
                        className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-muted/50"
                      >
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">
                            Term
                          </div>
                          <div className="font-medium">{fc.term}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">
                            Definition
                          </div>
                          <div>{fc.definition}</div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </section>
            )}

          {/* Questions */}
          {generatedGuide.questions && generatedGuide.questions.length > 0 && (
            <section className="rounded-xl border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">
                Practice Questions ({generatedGuide.questions.length})
              </h2>
              <div className="space-y-4">
                {generatedGuide.questions.map(
                  (
                    q: {
                      question: string;
                      answer: string;
                      type: string;
                      options?: string[];
                    },
                    idx: number
                  ) => (
                    <div key={idx} className="p-4 rounded-lg bg-muted/50">
                      <div className="font-medium mb-2">
                        Q{idx + 1}: {q.question}
                      </div>
                      {q.options && (
                        <ul className="mb-2 ml-4">
                          {q.options.map((opt: string, i: number) => (
                            <li
                              key={i}
                              className="text-sm text-muted-foreground"
                            >
                              {String.fromCharCode(65 + i)}. {opt}
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="text-sm text-primary">
                        <span className="font-medium">Answer:</span> {q.answer}
                      </div>
                    </div>
                  )
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/flashcards"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Create Study Guide</h1>
        </div>
        <p className="text-muted-foreground">
          Paste your notes, transcripts, or text content and let AI create a
          comprehensive study guide for you.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Content */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium mb-2">
            Content to Analyze *
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your notes, lecture transcript, or article text here... (minimum 100 characters)"
            rows={10}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="text-xs text-muted-foreground mt-1">
            {content.length} characters (minimum 100)
          </p>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Title (optional)
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Chapter 5: Cell Division"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {/* Content Type */}
        <div>
          <label className="block text-sm font-medium mb-2">Content Type</label>
          <div className="grid grid-cols-2 gap-2">
            {CONTENT_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setContentType(type.value)}
                className={cn(
                  "p-3 rounded-lg border text-left transition-colors",
                  contentType === type.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="font-medium text-sm">{type.label}</div>
                <div className="text-xs text-muted-foreground">
                  {type.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium mb-2">
            Subject (optional)
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g., Biology, History, Mathematics"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {/* Options */}
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={generateFlashcards}
              onChange={(e) => setGenerateFlashcards(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <span className="text-sm">Generate flashcards from content</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={generateQuestions}
              onChange={(e) => setGenerateQuestions(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <span className="text-sm">Generate practice questions</span>
          </label>
        </div>

        {/* Submit */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || content.length < 100}
          className="w-full h-12"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Generating Study Guide...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              Generate Study Guide
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
