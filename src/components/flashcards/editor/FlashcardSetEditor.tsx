"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { ErrorDisplay, PageContainer, PageHeader } from "@/components/common/UIComponents";
import { ImportModal } from "@/components/flashcards/ImportModal";
import type { ImportedCard } from "@/utils/flashcardImport";
import { SetDetailsForm } from "./SetDetailsForm";
import { CardEditorList } from "./CardEditorList";
import { EditorActionBar } from "./EditorActionBar";
import {
  MIN_CARDS,
  createEditorCard,
  hasAnyContent,
  isCardFilled,
  type EditorCard,
  type SetEditorValues,
} from "./types";

interface FlashcardSetEditorProps {
  heading: string;
  description?: string;
  backHref: string;
  backLabel: string;
  initialValues: SetEditorValues;
  userId: string;
  /** Set ID used for image storage paths. */
  imageSetId: string;
  /** Primary button text, given the number of complete cards. */
  submitLabel: (filledCount: number) => string;
  submittingLabel: string;
  /** Disable submit until at least this many cards are complete. */
  minFilledToSubmit?: number;
  /** Validate and persist. Resolve with an error message to show it, or nothing on success. */
  onSubmit: (values: SetEditorValues) => Promise<string | void>;
  /** Extra action shown in the action bar (e.g. delete). */
  extraAction?: React.ReactNode;
}

/** Shared create/edit form for flashcard sets. */
export function FlashcardSetEditor({
  heading,
  description,
  backHref,
  backLabel,
  initialValues,
  userId,
  imageSetId,
  submitLabel,
  submittingLabel,
  minFilledToSubmit = 0,
  onSubmit,
  extraAction,
}: FlashcardSetEditorProps) {
  const [title, setTitle] = useState(initialValues.title);
  const [setDescription, setSetDescription] = useState(initialValues.description);
  const [visibility, setVisibility] = useState(initialValues.visibility);
  const [cards, setCards] = useState<EditorCard[]>(initialValues.cards);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error]);

  const filledCount = cards.filter(isCardFilled).length;

  const handleImport = (imported: ImportedCard[]) => {
    const importedCards = imported.map((card) => createEditorCard(card));
    if (hasAnyContent(cards)) {
      setCards([...cards, ...importedCards]);
    } else {
      setCards(
        importedCards.length >= MIN_CARDS
          ? importedCards
          : [...importedCards, createEditorCard()]
      );
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const message = await onSubmit({ title, description: setDescription, visibility, cards });
      if (message) setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer width="narrow" className="max-w-4xl">
      <Link
        href={backHref}
        className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-3 mb-4 text-muted-foreground" })}
      >
        <ArrowLeft aria-hidden />
        {backLabel}
      </Link>

      <PageHeader
        title={heading}
        description={description}
        actions={<ImportModal onImport={handleImport} />}
      />

      <div ref={errorRef}>{error && <ErrorDisplay message={error} />}</div>

      <form onSubmit={handleSubmit} noValidate>
        <SetDetailsForm
          title={title}
          description={setDescription}
          visibility={visibility}
          onTitleChange={setTitle}
          onDescriptionChange={setSetDescription}
          onVisibilityChange={setVisibility}
        />

        <CardEditorList
          cards={cards}
          onCardsChange={setCards}
          onError={setError}
          userId={userId}
          imageSetId={imageSetId}
        />

        <EditorActionBar
          status={
            <>
              <span className="font-semibold text-foreground tabular-nums">{filledCount}</span>{" "}
              {filledCount === 1 ? "card" : "cards"} ready
            </>
          }
          secondary={
            <>
              {extraAction}
              <Link href={backHref} className={buttonVariants({ variant: "ghost" })}>
                Cancel
              </Link>
            </>
          }
          primary={
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={filledCount < minFilledToSubmit}
              className="min-w-32"
            >
              {isSubmitting ? submittingLabel : submitLabel(filledCount)}
            </Button>
          }
        />
      </form>
    </PageContainer>
  );
}
