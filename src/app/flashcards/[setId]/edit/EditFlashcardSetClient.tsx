"use client";

import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Flashcard, FlashcardSet } from "@/types/flashcard";
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
  Checkbox,
  FormActions,
} from "@/components/common/FormComponents";
import { Button } from "@/components/ui/button";

export default function EditFlashcardSetClient({ setId }: { setId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [set, setSet] = useState<FlashcardSet | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchFlashcardSet = async () => {
      try {
        const flashcardSet = await getFlashcardSet(setId);
        if (!flashcardSet) {
          setError("Flashcard set not found");
        } else if (flashcardSet.userId !== user.uid) {
          setError("You don't have permission to edit this flashcard set");
        } else {
          setSet(flashcardSet);
          setTitle(flashcardSet.title);
          setDescription(flashcardSet.description);
          setCards(flashcardSet.cards);
          setIsPublic(flashcardSet.isPublic);
        }
      } catch (err) {
        // Error already handled by UI state
        setError("Failed to load flashcard set. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlashcardSet();
  }, [user, setId]);

  const handleCardChange = (
    index: number,
    field: "term" | "definition",
    value: string
  ) => {
    const newCards = [...cards];
    newCards[index] = { ...newCards[index], [field]: value };
    setCards(newCards);
  };

  const addCard = () => {
    setCards([
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
      setError("A flashcard set must have at least 2 cards");
      return;
    }
    const newCards = [...cards];
    newCards.splice(index, 1);
    setCards(newCards);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    if (!title.trim()) {
      setError("Please enter a title for your flashcard set");
      return;
    }

    if (cards.some((card) => !card.term.trim() || !card.definition.trim())) {
      setError("All cards must have both a term and definition");
      return;
    }

    try {
      setIsSaving(true);

      if (!user) {
        setError("You must be logged in to update a flashcard set");
        return;
      }

      await updateFlashcardSet(setId, user.uid, {
        title,
        description,
        cards,
        isPublic,
      });

      // Redirect to the flashcards page
      router.push(ROUTES.FLASHCARDS.INDEX);
    } catch (err) {
      // Error already handled by UI state
      setError("Failed to update flashcard set. Please try again.");
    } finally {
      setIsSaving(false);
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
      setError("You must be logged in to delete a flashcard set");
      return;
    }

    try {
      setIsDeleting(true);
      await deleteFlashcardSet(setId, user.uid);
      router.push(ROUTES.FLASHCARDS.INDEX);
    } catch (err) {
      // Error already handled by UI state
      setError("Failed to delete flashcard set. Please try again.");
      setIsDeleting(false);
    }
  };

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
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Biology Terms"
              required
            />
          </FormField>

          <FormField label="Description (optional)">
            <TextArea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for your flashcard set"
              rows={3}
            />
          </FormField>

          <Checkbox
            label="Make this set public"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
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
