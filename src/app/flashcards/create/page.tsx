"use client";

import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flashcard } from "@/types/flashcard";
import { createFlashcardSet } from "@/services/flashcardService";
import { validateFlashcardSet } from "@/utils/flashcardUtils";
import { ROUTES } from "@/constants/appConstants";
import {
  PageContainer,
  PageHeader,
  ErrorDisplay,
  SectionContainer,
} from "@/components/common/UIComponents";
import {
  FormField,
  TextInput,
  TextArea,
  Checkbox,
  FormActions,
  FormSection,
} from "@/components/common/FormComponents";
import { Button } from "@/components/ui/button";

export default function CreateFlashcardSetPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cards, setCards] = useState<Omit<Flashcard, "id" | "createdAt">[]>([
    { term: "", definition: "" },
    { term: "", definition: "" },
  ]);
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <PageContainer>
        <PageHeader title="Create Flashcard Set" />
        <p>Please sign in to create flashcard sets.</p>
      </PageContainer>
    );
  }

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
    setCards([...cards, { term: "", definition: "" }]);
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

  const validateForm = () => {
    const validationError = validateFlashcardSet(title, cards);
    if (validationError) {
      setError(validationError);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      // Trim all inputs before sending to database
      const trimmedCards = cards.map((card) => ({
        term: card.term.trim(),
        definition: card.definition.trim(),
      }));

      await createFlashcardSet(
        user.uid,
        title.trim(),
        description.trim(),
        trimmedCards,
        isPublic
      );

      // Redirect to the flashcards page
      router.push(ROUTES.FLASHCARDS.INDEX);
    } catch (err) {
      // Error already handled by UI state
      setError("Failed to create flashcard set. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader title="Create New Flashcard Set" />

      {error && <ErrorDisplay message={error} />}

      <form onSubmit={handleSubmit}>
        <FormSection title="Set Details">
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
        </FormSection>

        <h2 className="text-xl font-semibold mb-4">Cards</h2>

        <div className="space-y-4 mb-6">
          {cards.map((card, index) => (
            <SectionContainer
              key={index}
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
                  className="text-red-600 hover:text-red-800"
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

        <FormActions>
          <Button type="submit" isLoading={isLoading} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Flashcard Set"}
          </Button>
        </FormActions>
      </form>
    </PageContainer>
  );
}
