"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Check, Layers, RotateCcw } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  ErrorDisplay,
  LoadingState,
  PageContainer,
  PageHeader,
} from "@/components/common/UIComponents";
import { SignInGate, SignInGateIcons } from "@/components/auth/SignInGate";
import {
  MIN_CONTENT_LENGTH,
  StudyGuideForm,
  type StudyGuideRequest,
} from "@/components/study-guides/StudyGuideForm";
import { StudyGuideGenerating } from "@/components/study-guides/StudyGuideGenerating";
import { StudyGuideResult } from "@/components/study-guides/StudyGuideResult";
import { createFlashcardSet } from "@/services/flashcardService";
import { ROUTES } from "@/constants/appConstants";
import type { StudyGuide } from "@/types/study-guide";

const INITIAL_REQUEST: StudyGuideRequest = {
  content: "",
  title: "",
  contentType: "text",
  subject: "",
  generateFlashcards: true,
  generateQuestions: true,
};

export default function CreateStudyGuideClient() {
  const { user, isLoading: authLoading } = useAuth();
  const [request, setRequest] = useState<StudyGuideRequest>(INITIAL_REQUEST);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guide, setGuide] = useState<StudyGuide | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSetId, setSavedSetId] = useState<string | null>(null);

  const updateRequest = (patch: Partial<StudyGuideRequest>) =>
    setRequest((prev) => ({ ...prev, ...patch }));

  const handleGenerate = async () => {
    const { content, title, contentType, subject, generateFlashcards, generateQuestions } = request;
    if (!content.trim() || content.length < MIN_CONTENT_LENGTH) {
      setError(`Please enter at least ${MIN_CONTENT_LENGTH} characters of content`);
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

      const data = (await response.json()) as { error?: string; studyGuide?: StudyGuide };
      if (!response.ok || !data.studyGuide) {
        throw new Error(data.error || "Failed to generate study guide");
      }

      setGuide(data.studyGuide);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveFlashcards = async () => {
    if (!guide?.flashcards || !user) return;

    setIsSaving(true);
    setError(null);
    try {
      const cards = guide.flashcards.map(({ term, definition }) => ({ term, definition }));
      const setId = await createFlashcardSet(
        user.uid,
        `${guide.title} - Flashcards`,
        `Generated from study guide: ${guide.title}`,
        cards,
        "private"
      );
      setSavedSetId(setId);
    } catch {
      setError("Failed to save flashcards");
    } finally {
      setIsSaving(false);
    }
  };

  const startOver = () => {
    setGuide(null);
    setSavedSetId(null);
    setError(null);
  };

  if (authLoading) {
    return (
      <PageContainer width="narrow">
        <LoadingState message="Checking your session..." />
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer width="narrow">
        <SignInGate
          title="Sign in to create study guides"
          description="Turn your notes into a summary, key points, flashcards, and practice questions."
          icon={SignInGateIcons.flashcard}
        />
      </PageContainer>
    );
  }

  if (guide) {
    const hasFlashcards = (guide.flashcards?.length ?? 0) > 0;
    return (
      <PageContainer width="narrow">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={startOver}
          className="-ml-3 mb-4 text-muted-foreground"
        >
          <RotateCcw aria-hidden />
          Start over
        </Button>

        <PageHeader
          eyebrow="Step 2 of 2 · Your study guide"
          title={guide.title}
          description="Review your guide below, then save the flashcards to study them."
          actions={
            hasFlashcards &&
            (savedSetId ? (
              <Link href={ROUTES.FLASHCARDS.SET(savedSetId)} className={buttonVariants({ variant: "success" })}>
                <Check aria-hidden />
                Saved · Open set
              </Link>
            ) : (
              <Button type="button" onClick={handleSaveFlashcards} isLoading={isSaving}>
                {!isSaving && <Layers aria-hidden />}
                {isSaving ? "Saving..." : "Save as flashcard set"}
              </Button>
            ))
          }
        />

        {error && <ErrorDisplay message={error} />}

        <div className="animate-fade-in">
          <StudyGuideResult guide={guide} />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer width="narrow">
      <Link
        href={ROUTES.FLASHCARDS.INDEX}
        className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-3 mb-4 text-muted-foreground" })}
      >
        <ArrowLeft aria-hidden />
        Back
      </Link>

      <PageHeader
        eyebrow="Step 1 of 2 · Add your material"
        title="Create a study guide"
        description="Paste your notes or reading and AI will turn them into a summary, key points, flashcards, and practice questions."
      />

      {error && <ErrorDisplay message={error} />}

      {isGenerating ? (
        <StudyGuideGenerating />
      ) : (
        <StudyGuideForm values={request} onChange={updateRequest} onSubmit={handleGenerate} />
      )}
    </PageContainer>
  );
}
