"use client";

import { useAuth } from "@/lib/auth";
import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Flashcard } from "@/types/flashcard";
import { createFlashcardSet } from "@/services/flashcardService";
import { validateFlashcardSet } from "@/utils/flashcardUtils";
import { ROUTES } from "@/constants/appConstants";
import {
  PageContainer,
  PageHeader,
  ErrorDisplay,
  LoadingState,
} from "@/components/common/UIComponents";
import {
  FormField,
  TextInput,
  TextArea,
  FormActions,
  FormSection,
} from "@/components/common/FormComponents";
import { Button } from "@/components/ui/button";
import { ImportModal } from "@/components/flashcards/ImportModal";
import { ImageUploadButton } from "@/components/flashcards/ImageUpload";
import type { ImportedCard } from "@/utils/flashcardImport";
import {
  GripVertical,
  Plus,
  Trash2,
  Globe,
  Lock,
  Link as LinkIcon,
  Image,
} from "lucide-react";

type CardFormData = Omit<Flashcard, "id" | "createdAt"> & {
  termImageUrl?: string;
  definitionImageUrl?: string;
};
type Visibility = "public" | "unlisted" | "private";

const VISIBILITY_OPTIONS: {
  value: Visibility;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    value: "public",
    label: "Public",
    icon: <Globe className="h-4 w-4" />,
    description: "Anyone can find and study this set",
  },
  {
    value: "unlisted",
    label: "Unlisted",
    icon: <LinkIcon className="h-4 w-4" />,
    description: "Only people with the link can access",
  },
  {
    value: "private",
    label: "Private",
    icon: <Lock className="h-4 w-4" />,
    description: "Only you can see this set",
  },
];

// Generate a temporary ID for uploads before the set is created
function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export default function CreateFlashcardSetClient() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cards, setCards] = useState<CardFormData[]>([
    { term: "", definition: "" },
    { term: "", definition: "" },
  ]);
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [focusedCardIndex, setFocusedCardIndex] = useState<number | null>(null);
  const [showImageUpload, setShowImageUpload] = useState<{
    [key: number]: boolean;
  }>({});
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Temporary set ID for image uploads before the set is created
  const tempSetIdRef = useRef(generateTempId());
  const tempSetId = tempSetIdRef.current;

  // Focus management for newly added cards
  useEffect(() => {
    if (focusedCardIndex !== null && cardRefs.current[focusedCardIndex]) {
      const cardEl = cardRefs.current[focusedCardIndex];
      const termInput = cardEl?.querySelector<HTMLInputElement>(
        'input[data-field="term"]'
      );
      termInput?.focus();
      setFocusedCardIndex(null);
    }
  }, [focusedCardIndex, cards.length]);

  if (isAuthLoading) {
    return (
      <PageContainer>
        <PageHeader title="Create Flashcard Set" />
        <LoadingState message="Checking your session..." />
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer>
        <PageHeader title="Create Flashcard Set" />
        <p className="text-muted-foreground">
          Please sign in to create flashcard sets.
        </p>
      </PageContainer>
    );
  }

  const handleCardChange = (
    index: number,
    field: "term" | "definition",
    value: string
  ) => {
    const newCards = [...cards];
    const currentCard = newCards[index];
    if (currentCard) {
      newCards[index] = { ...currentCard, [field]: value };
      setCards(newCards);
    }
  };

  const handleImageChange = (
    index: number,
    field: "termImageUrl" | "definitionImageUrl",
    url: string | undefined
  ) => {
    const newCards = [...cards];
    const currentCard = newCards[index];
    if (currentCard) {
      newCards[index] = { ...currentCard, [field]: url };
      setCards(newCards);
    }
  };

  const toggleImageUpload = (index: number) => {
    setShowImageUpload((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const addCard = (afterIndex?: number) => {
    const newCard = { term: "", definition: "" };
    if (afterIndex !== undefined) {
      const newCards = [...cards];
      newCards.splice(afterIndex + 1, 0, newCard);
      setCards(newCards);
      setFocusedCardIndex(afterIndex + 1);
    } else {
      setCards([...cards, newCard]);
      setFocusedCardIndex(cards.length);
    }
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

  const handleImport = (importedCards: ImportedCard[]) => {
    // Add imported cards to existing cards (or replace if empty)
    const hasContent = cards.some((c) => c.term.trim() || c.definition.trim());
    if (hasContent) {
      setCards([...cards, ...importedCards]);
    } else {
      setCards(
        importedCards.length >= 2
          ? importedCards
          : [...importedCards, { term: "", definition: "" }]
      );
    }
    setError(null);
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newCards = [...cards];
    const draggedCard = newCards[draggedIndex];
    if (!draggedCard) return;

    newCards.splice(draggedIndex, 1);
    newCards.splice(index, 0, draggedCard);
    setCards(newCards);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Keyboard shortcuts
  const handleKeyDown = (
    e: React.KeyboardEvent,
    index: number,
    field: "term" | "definition"
  ) => {
    // Tab from definition to add new card
    if (
      e.key === "Tab" &&
      !e.shiftKey &&
      field === "definition" &&
      index === cards.length - 1
    ) {
      e.preventDefault();
      addCard();
    }
    // Enter to move to definition or next card
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (field === "term") {
        // Move to definition
        const cardEl = cardRefs.current[index];
        const defInput = cardEl?.querySelector<HTMLInputElement>(
          'input[data-field="definition"]'
        );
        defInput?.focus();
      } else {
        // Add new card
        addCard(index);
      }
    }
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

    if (!validateForm()) return;

    try {
      setIsLoading(true);

      const trimmedCards = cards.map((card) => ({
        term: card.term.trim(),
        definition: card.definition.trim(),
        termImageUrl: card.termImageUrl,
        definitionImageUrl: card.definitionImageUrl,
      }));

      // Filter out empty cards
      const validCards = trimmedCards.filter((c) => c.term && c.definition);

      const isPublic = visibility === "public";

      await createFlashcardSet(
        user.uid,
        title.trim(),
        description.trim(),
        validCards,
        isPublic
      );

      router.push(ROUTES.FLASHCARDS.INDEX);
    } catch {
      setError("Failed to create flashcard set. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const filledCardsCount = cards.filter(
    (c) => c.term.trim() && c.definition.trim()
  ).length;

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Create New Flashcard Set" className="mb-0" />
        <ImportModal onImport={handleImport} />
      </div>

      {error && <ErrorDisplay message={error} />}

      <form onSubmit={handleSubmit}>
        <FormSection title="Set Details">
          <FormField label="Title" required>
            <TextInput
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Biology Terms, Spanish Vocabulary"
              required
              autoFocus
            />
          </FormField>

          <FormField label="Description (optional)">
            <TextArea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description to help others understand what this set covers"
              rows={2}
            />
          </FormField>

          <FormField label="Visibility">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {VISIBILITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setVisibility(option.value)}
                  className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                    visibility === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div
                    className={`mt-0.5 ${
                      visibility === option.value
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    {option.icon}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{option.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {option.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </FormField>
        </FormSection>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            Cards{" "}
            <span className="text-muted-foreground font-normal text-base">
              ({filledCardsCount} of {cards.length})
            </span>
          </h2>
          <div className="text-sm text-muted-foreground">
            Press{" "}
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">
              Enter
            </kbd>{" "}
            to add cards quickly
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {cards.map((card, index) => (
            <div
              key={index}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`group relative rounded-lg border border-border bg-card p-4 transition-all ${
                draggedIndex === index ? "opacity-50 scale-[0.98]" : ""
              } ${
                draggedIndex !== null && draggedIndex !== index
                  ? "border-dashed"
                  : ""
              }`}
            >
              <div className="flex gap-4">
                {/* Drag handle */}
                <div
                  className="flex items-center cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                  title="Drag to reorder"
                >
                  <GripVertical className="h-5 w-5" />
                </div>

                {/* Card number */}
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                  {index + 1}
                </div>

                {/* Inputs */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Term
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        data-field="term"
                        value={card.term}
                        onChange={(e) =>
                          handleCardChange(index, "term", e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, index, "term")}
                        placeholder="Enter term"
                        className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                      {user && (
                        <ImageUploadButton
                          imageUrl={card.termImageUrl}
                          onChange={(url) =>
                            handleImageChange(index, "termImageUrl", url)
                          }
                          userId={user.uid}
                          setId={tempSetId}
                          cardId={`card_${index}`}
                          side="term"
                        />
                      )}
                    </div>
                    {card.termImageUrl && (
                      <div className="mt-2 relative aspect-video max-w-[200px] rounded-lg overflow-hidden border">
                        <img
                          src={card.termImageUrl}
                          alt="Term"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Definition
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        data-field="definition"
                        value={card.definition}
                        onChange={(e) =>
                          handleCardChange(index, "definition", e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, index, "definition")}
                        placeholder="Enter definition"
                        className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                      {user && (
                        <ImageUploadButton
                          imageUrl={card.definitionImageUrl}
                          onChange={(url) =>
                            handleImageChange(index, "definitionImageUrl", url)
                          }
                          userId={user.uid}
                          setId={tempSetId}
                          cardId={`card_${index}`}
                          side="definition"
                        />
                      )}
                    </div>
                    {card.definitionImageUrl && (
                      <div className="mt-2 relative aspect-video max-w-[200px] rounded-lg overflow-hidden border">
                        <img
                          src={card.definitionImageUrl}
                          alt="Definition"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addCard(index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Add card below"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCard(index)}
                    className="text-muted-foreground hover:text-destructive"
                    disabled={cards.length <= 2}
                    title="Remove card"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => addCard()}
            className="w-full border-dashed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Card
          </Button>
        </div>

        <FormActions>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(ROUTES.FLASHCARDS.INDEX)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || filledCardsCount < 2}>
            {isLoading
              ? "Creating..."
              : `Create Set (${filledCardsCount} cards)`}
          </Button>
        </FormActions>
      </form>
    </PageContainer>
  );
}
