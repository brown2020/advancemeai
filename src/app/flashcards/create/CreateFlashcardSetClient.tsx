"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { createFlashcardSet } from "@/services/flashcardService";
import { validateFlashcardSet } from "@/utils/flashcardUtils";
import { ROUTES } from "@/constants/appConstants";
import type { FlashcardFormData } from "@/types/flashcard";
import { LoadingState, PageContainer } from "@/components/common/UIComponents";
import { SignInGate, SignInGateIcons } from "@/components/auth/SignInGate";
import { FlashcardSetEditor } from "@/components/flashcards/editor/FlashcardSetEditor";
import {
  MIN_CARDS,
  createEditorCard,
  type EditorCard,
  type SetEditorValues,
} from "@/components/flashcards/editor/types";

// Temporary set ID for image uploads before the set is created
function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/** Trim text and omit empty image fields (Firestore rejects undefined values). */
function toFormData(card: EditorCard): FlashcardFormData {
  const next: FlashcardFormData = {
    term: card.term.trim(),
    definition: card.definition.trim(),
  };
  if (card.termImageUrl) next.termImageUrl = card.termImageUrl;
  if (card.definitionImageUrl) next.definitionImageUrl = card.definitionImageUrl;
  return next;
}

export default function CreateFlashcardSetClient() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [tempSetId] = useState(generateTempId);
  const [initialValues] = useState<SetEditorValues>(() => ({
    title: "",
    description: "",
    visibility: "public",
    cards: [createEditorCard(), createEditorCard()],
  }));

  if (isAuthLoading) {
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
          title="Sign in to create a set"
          description="Make your own flashcards, add images, and study them any way you like."
          icon={SignInGateIcons.flashcard}
        />
      </PageContainer>
    );
  }

  const handleSubmit = async ({
    title,
    description,
    visibility,
    cards,
  }: SetEditorValues): Promise<string | void> => {
    const validationError = validateFlashcardSet(title, cards);
    if (validationError) return validationError;

    // Filter out empty cards
    const validCards = cards.map(toFormData).filter((c) => c.term && c.definition);

    try {
      await createFlashcardSet(user.uid, title.trim(), description.trim(), validCards, visibility);
      router.push(ROUTES.FLASHCARDS.INDEX);
    } catch {
      return "Failed to create flashcard set. Please try again.";
    }
  };

  return (
    <FlashcardSetEditor
      heading="Create a new set"
      description="Add a title, then type your terms and definitions. Paste a list with Import to go faster."
      backHref={ROUTES.FLASHCARDS.INDEX}
      backLabel="Your library"
      initialValues={initialValues}
      userId={user.uid}
      imageSetId={tempSetId}
      submitLabel={(count) => `Create set (${count} ${count === 1 ? "card" : "cards"})`}
      submittingLabel="Creating..."
      minFilledToSubmit={MIN_CARDS}
      onSubmit={handleSubmit}
    />
  );
}
