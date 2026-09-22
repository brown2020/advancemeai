"use client";

import { useAuth } from "@/lib/auth";
import { useState, useEffect, useReducer} from "react";
import { useRouter } from "next/navigation";
import { Flashcard, FlashcardSet, type FlashcardVisibility } from "@/types/flashcard";
import { normalizeVisibility } from "@/lib/flashcard-visibility";
import { VisibilityField } from "@/components/flashcards/VisibilityField";
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
  SectionContainer,
  ActionLink,
} from "@/components/common/UIComponents";
import {
  FormField,
  TextInput,
  TextArea,
  FormActions,
} from "@/components/common/FormComponents";
import { Button } from "@/components/ui/button";

function useEditFlashcardSetClientModel({

  setId,
  initialSet,
}: {
  setId: string;
  initialSet?: FlashcardSet;
}) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [state, dispatch] = useReducer(
    (s: any, p: Record<string, any>): any => {
      const patch: Record<string, any> = {};
      for (const key of Object.keys(p)) {
        const value = p[key];
        patch[key] = typeof value === "function" ? value(s[key]) : value;
      }
      return { ...s, ...patch };
    },
    {
    set: null,
    title: "",
    description: "",
    cards: [],
    visibility: "private",
    isLoading: true,
    isSaving: false,
    isDeleting: false,
    error: null,
    }
  );
  const { set, title, description, cards, visibility, isLoading, isSaving, isDeleting, error } = state as any;
  const assignSet = (value: any) => dispatch({ set: value });
  const assignTitle = (value: any) => dispatch({ title: value });
  const assignDescription = (value: any) => dispatch({ description: value });
  const assignCards = (value: any) => dispatch({ cards: value });
  const assignVisibility = (value: any) => dispatch({ visibility: value });
  const assignIsLoading = (value: any) => dispatch({ isLoading: value });
  const assignIsSaving = (value: any) => dispatch({ isSaving: value });
  const assignIsDeleting = (value: any) => dispatch({ isDeleting: value });
  const assignError = (value: any) => dispatch({ error: value });


  useEffect(() => {
    if (!user) {
      assignIsLoading(false);
      return;
    }

    const fetchFlashcardSet = async () => {
      try {
        if (initialSet) {
          if (initialSet.userId !== user.uid) {
            assignError("You don't have permission to edit this flashcard set");
            return;
          }
          assignSet(initialSet);
          assignTitle(initialSet.title);
          assignDescription(initialSet.description);
          assignCards(initialSet.cards);
          assignVisibility(
            normalizeVisibility({
              visibility: initialSet.visibility,
              isPublic: initialSet.isPublic,
            })
          );
          return;
        }

        const flashcardSet = await getFlashcardSet(setId);
        if (!flashcardSet) {
          assignError("Flashcard set not found");
        } else if (flashcardSet.userId !== user.uid) {
          assignError("You don't have permission to edit this flashcard set");
        } else {
          assignSet(flashcardSet);
          assignTitle(flashcardSet.title);
          assignDescription(flashcardSet.description);
          assignCards(flashcardSet.cards);
          assignVisibility(
            normalizeVisibility({
              visibility: flashcardSet.visibility,
              isPublic: flashcardSet.isPublic,
            })
          );
        }
      } catch {
        assignError("Failed to load flashcard set. Please try again.");
      } finally {
        assignIsLoading(false);
      }
    };

    fetchFlashcardSet();
  }, [initialSet, user, setId]);

  const handleCardChange = (
    index: number,
    field: "term" | "definition",
    value: string
  ) => {
    const newCards = [...cards];
    const currentCard = newCards[index];
    if (currentCard) {
      newCards[index] = { ...currentCard, [field]: value };
      assignCards(newCards);
    }
  };

  const addCard = () => {
    assignCards([
      ...cards,
      {
        id: crypto.randomUUID(),
        term: "",
        definition: "",
        createdAt: Date.now(),
      },
    ]);
  };

  const removeCard = (index: number) => {
    if (cards.length <= 2) {
      assignError("A flashcard set must have at least 2 cards");
      return;
    }
    const newCards = [...cards];
    newCards.splice(index, 1);
    assignCards(newCards);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    assignError(null);

    // Validate
    if (!title.trim()) {
      assignError("Please enter a title for your flashcard set");
      return;
    }

    if (cards.some((card) => !card.term.trim() || !card.definition.trim())) {
      assignError("All cards must have both a term and definition");
      return;
    }

    try {
      assignIsSaving(true);

      if (!user) {
        assignError("You must be logged in to update a flashcard set");
        return;
      }

      await updateFlashcardSet(setId, user.uid, {
        title,
        description,
        cards,
        visibility,
      });

      // Redirect to the flashcards page
      router.push(ROUTES.FLASHCARDS.INDEX);
    } catch {
      assignError("Failed to update flashcard set. Please try again.");
    } finally {
      assignIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this flashcard set? This action cannot be undone."
      )
    ) {
      return;
    }

    if (!user) {
      assignError("You must be logged in to delete a flashcard set");
      return;
    }

    try {
      assignIsDeleting(true);
      await deleteFlashcardSet(setId, user.uid);
      router.push(ROUTES.FLASHCARDS.INDEX);
    } catch {
      assignError("Failed to delete flashcard set. Please try again.");
      assignIsDeleting(false);
    }
  };

  if (isAuthLoading) {
    return (
      <PageContainer>
        <PageHeader title="Edit Flashcard Set" />
        <LoadingState message="Checking your session..." />
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer>
        <PageHeader title="Edit Flashcard Set" />
        <p className="text-muted-foreground">
          Please sign in to edit flashcard sets.
        </p>
      </PageContainer>
    );
  }

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Edit Flashcard Set" />
        <LoadingState message="Loading flashcard set..." />
      </PageContainer>
    );
  }

  if (error && !set) {
    return (
      <PageContainer>
        <PageHeader title="Edit Flashcard Set" />
        <ErrorDisplay message={error} />
        <ActionLink href={ROUTES.FLASHCARDS.INDEX}>
          Back to Flashcards
        </ActionLink>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <ActionLink href={ROUTES.FLASHCARDS.INDEX} variant="secondary">
          ← Back to Flashcards
        </ActionLink>
      </div>

      <PageHeader title="Edit Flashcard Set" />

      {error && <ErrorDisplay message={error} />}

      <form onSubmit={handleSubmit}>
        <SectionContainer className="mb-6">
          <FormField label="Title" required>
            <TextInput
              type="text"
              value={title}
              onChange={(e) => assignTitle(e.target.value)}
              placeholder="e.g., Biology Terms"
              required
            />
          </FormField>

          <FormField label="Description (optional)">
            <TextArea
              value={description}
              onChange={(e) => assignDescription(e.target.value)}
              placeholder="Add a description for your flashcard set"
              rows={3}
            />
          </FormField>

          <VisibilityField value={visibility} onChange={assignVisibility} />
        </SectionContainer>

        <h2 className="text-xl font-semibold mb-4">Cards</h2>

        <div className="space-y-4 mb-6">
          {cards.map((card, index) => (
            <SectionContainer
              key={card.id}
              className="p-4 flex flex-col md:flex-row gap-4"
            >
              <FormField label="Term" className="flex-1">
                <TextInput
                  type="text"
                  value={card.term}
                  onChange={(e) =>
                    handleCardChange(index, "term", e.target.value)
                  }
                  placeholder="Enter term"
                  required
                />
              </FormField>
              <FormField label="Definition" className="flex-1">
                <TextInput
                  type="text"
                  value={card.definition}
                  onChange={(e) =>
                    handleCardChange(index, "definition", e.target.value)
                  }
                  placeholder="Enter definition"
                  required
                />
              </FormField>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeCard(index)}
                  className="text-destructive hover:text-destructive"
                >
                  Remove
                </Button>
              </div>
            </SectionContainer>
          ))}
        </div>

        <div className="mb-6">
          <Button type="button" variant="outline" onClick={addCard}>
            + Add Card
          </Button>
        </div>

        <FormActions className="justify-between">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            isLoading={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Set"}
          </Button>

          <Button type="submit" disabled={isSaving} isLoading={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </FormActions>
      </form>
    </PageContainer>
  );
}

export default function EditFlashcardSetClient(...args: Parameters<typeof useEditFlashcardSetClientModel>) {
  return useEditFlashcardSetClientModel(...args);
}

