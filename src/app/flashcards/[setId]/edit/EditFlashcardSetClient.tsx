"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import type { Flashcard, FlashcardSet } from "@/types/flashcard";
import { normalizeVisibility } from "@/lib/flashcard-visibility";
import {
  getFlashcardSet,
  updateFlashcardSet,
  deleteFlashcardSet,
} from "@/services/flashcardService";
import { ROUTES } from "@/constants/appConstants";
import {
  PageContainer,
  PageHeader,
  ErrorDisplay,
  LoadingState,
  ActionLink,
} from "@/components/common/UIComponents";
import { SignInGate, SignInGateIcons } from "@/components/auth/SignInGate";
import { FlashcardSetEditor } from "@/components/flashcards/editor/FlashcardSetEditor";
import { DeleteSetButton } from "@/components/flashcards/editor/DeleteSetButton";
import {
  createEditorCard,
  type EditorCard,
  type SetEditorValues,
} from "@/components/flashcards/editor/types";

const PERMISSION_ERROR = "You don't have permission to edit this flashcard set";

function toEditorValues(set: FlashcardSet): SetEditorValues {
  return {
    title: set.title,
    description: set.description,
    visibility: normalizeVisibility({ visibility: set.visibility, isPublic: set.isPublic }),
    cards: set.cards.map(({ id, createdAt, term, definition, termImageUrl, definitionImageUrl }) =>
      createEditorCard({ id, createdAt, term, definition, termImageUrl, definitionImageUrl })
    ),
  };
}

/** Back to the stored card shape; new cards get an id + timestamp, empty image fields are omitted. */
function toFlashcard(card: EditorCard): Flashcard {
  const next: Flashcard = {
    id: card.id ?? crypto.randomUUID(),
    term: card.term,
    definition: card.definition,
    createdAt: card.createdAt ?? Date.now(),
  };
  if (card.termImageUrl) next.termImageUrl = card.termImageUrl;
  if (card.definitionImageUrl) next.definitionImageUrl = card.definitionImageUrl;
  return next;
}

interface EditFlashcardSetClientProps {
  setId: string;
  initialSet?: FlashcardSet;
}

export default function EditFlashcardSetClient({ setId, initialSet }: EditFlashcardSetClientProps) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [initialValues, setInitialValues] = useState<SetEditorValues | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchFlashcardSet = async () => {
      try {
        const flashcardSet = initialSet ?? (await getFlashcardSet(setId));
        if (!flashcardSet) {
          setLoadError("Flashcard set not found");
        } else if (flashcardSet.userId !== user.uid) {
          setLoadError(PERMISSION_ERROR);
        } else {
          setInitialValues(toEditorValues(flashcardSet));
        }
      } catch {
        setLoadError("Failed to load flashcard set. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchFlashcardSet();
  }, [initialSet, user, setId]);

  if (isAuthLoading || (user && isLoading)) {
    return (
      <PageContainer width="narrow">
        <LoadingState message={isAuthLoading ? "Checking your session..." : "Loading flashcard set..."} />
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer width="narrow">
        <SignInGate
          title="Sign in to edit this set"
          description="You need to be signed in as the set's owner to make changes."
          icon={SignInGateIcons.flashcard}
        />
      </PageContainer>
    );
  }

  if (!initialValues) {
    return (
      <PageContainer width="narrow">
        <PageHeader title="Edit set" />
        <ErrorDisplay message={loadError ?? "Flashcard set not found"} />
        <ActionLink href={ROUTES.FLASHCARDS.INDEX} variant="secondary">
          Back to Flashcards
        </ActionLink>
      </PageContainer>
    );
  }

  const handleSubmit = async ({
    title,
    description,
    visibility,
    cards,
  }: SetEditorValues): Promise<string | void> => {
    if (!title.trim()) {
      return "Please enter a title for your flashcard set";
    }
    if (cards.some((card) => !card.term.trim() || !card.definition.trim())) {
      return "All cards must have both a term and definition";
    }

    try {
      await updateFlashcardSet(setId, user.uid, {
        title,
        description,
        cards: cards.map(toFlashcard),
        visibility,
      });
      router.push(ROUTES.FLASHCARDS.INDEX);
    } catch {
      return "Failed to update flashcard set. Please try again.";
    }
  };

  const handleDelete = async (): Promise<string | void> => {
    try {
      await deleteFlashcardSet(setId, user.uid);
      router.push(ROUTES.FLASHCARDS.INDEX);
    } catch {
      return "Failed to delete flashcard set. Please try again.";
    }
  };

  return (
    <FlashcardSetEditor
      heading="Edit set"
      backHref={ROUTES.FLASHCARDS.SET(setId)}
      backLabel="Back to set"
      initialValues={initialValues}
      userId={user.uid}
      imageSetId={setId}
      submitLabel={() => "Save changes"}
      submittingLabel="Saving..."
      onSubmit={handleSubmit}
      extraAction={<DeleteSetButton onDelete={handleDelete} />}
    />
  );
}
