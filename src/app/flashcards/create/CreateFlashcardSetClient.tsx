"use client";

import Image from "next/image";

import { useAuth } from "@/lib/auth";
import { useState, useRef, useEffect, useReducer} from "react";
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
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { VisibilityField } from "@/components/flashcards/VisibilityField";
import type { FlashcardVisibility } from "@/types/flashcard";

type CardFormData = Omit<Flashcard, "id" | "createdAt"> & {
  termImageUrl?: string;
  definitionImageUrl?: string;
};

// Generate a temporary ID for uploads before the set is created
function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function useCreateFlashcardSetClientModel() {

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
    title: "",
    description: "",
    cards: [
    { term: "", definition: "" },
    { term: "", definition: "" },
  ],
    visibility: "public",
    isLoading: false,
    error: null,
    draggedIndex: null,
    focusedCardIndex: null,
    }
  );
  const { title, description, cards, visibility, isLoading, error, draggedIndex, focusedCardIndex } = state as any;
  const assignTitle = (value: any) => dispatch({ title: value });
  const assignDescription = (value: any) => dispatch({ description: value });
  const assignCards = (value: any) => dispatch({ cards: value });
  const assignVisibility = (value: any) => dispatch({ visibility: value });
  const assignIsLoading = (value: any) => dispatch({ isLoading: value });
  const assignError = (value: any) => dispatch({ error: value });
  const assignDraggedIndex = (value: any) => dispatch({ draggedIndex: value });
  const assignFocusedCardIndex = (value: any) => dispatch({ focusedCardIndex: value });

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
      assignFocusedCardIndex(null);
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
    rowNo: number,
    field: "term" | "definition",
    value: string
  ) => {
    const newCards = [...cards];
    const currentCard = newCards[rowNo];
    if (currentCard) {
      newCards[rowNo] = { ...currentCard, [field]: value };
      assignCards(newCards);
    }
  };

  const handleImageChange = (
    rowNo: number,
    field: "termImageUrl" | "definitionImageUrl",
    url: string | undefined
  ) => {
    const newCards = [...cards];
    const currentCard = newCards[rowNo];
    if (currentCard) {
      newCards[rowNo] = { ...currentCard, [field]: url };
      assignCards(newCards);
    }
  };

  const addCard = (afterIndex?: number) => {
    const newCard = { term: "", definition: "" };
    if (afterIndex !== undefined) {
      const newCards = [...cards];
      newCards.splice(afterIndex + 1, 0, newCard);
      assignCards(newCards);
      assignFocusedCardIndex(afterIndex + 1);
    } else {
      assignCards([...cards, newCard]);
      assignFocusedCardIndex(cards.length);
    }
  };

  const removeCard = (rowNo: number) => {
    if (cards.length <= 2) {
      assignError("A flashcard set must have at least 2 cards");
      return;
    }
    const newCards = [...cards];
    newCards.splice(rowNo, 1);
    assignCards(newCards);
  };

  const handleImport = (importedCards: ImportedCard[]) => {
    // Add imported cards to existing cards (or replace if empty)
    const hasContent = cards.some((c) => c.term.trim() || c.definition.trim());
    if (hasContent) {
      assignCards([...cards, ...importedCards]);
    } else {
      assignCards(
        importedCards.length >= 2
          ? importedCards
          : [...importedCards, { term: "", definition: "" }]
      );
    }
    assignError(null);
  };

  // Drag and drop handlers
  const handleDragStart = (rowNo: number) => {
    assignDraggedIndex(rowNo);
  };

  const handleDragOver = (e: React.DragEvent, rowNo: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === rowNo) return;

    const newCards = [...cards];
    const draggedCard = newCards[draggedIndex];
    if (!draggedCard) return;

    newCards.splice(draggedIndex, 1);
    newCards.splice(rowNo, 0, draggedCard);
    assignCards(newCards);
    assignDraggedIndex(rowNo);
  };

  const handleDragEnd = () => {
    assignDraggedIndex(null);
  };

  // Keyboard shortcuts
  const handleKeyDown = (
    e: React.KeyboardEvent,
    rowNo: number,
    field: "term" | "definition"
  ) => {
    // Tab from definition to add new card
    if (
      e.key === "Tab" &&
      !e.shiftKey &&
      field === "definition" &&
      rowNo === cards.length - 1
    ) {
      e.preventDefault();
      addCard();
    }
    // Enter to move to definition or next card
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (field === "term") {
        // Move to definition
        const cardEl = cardRefs.current[rowNo];
        const defInput = cardEl?.querySelector<HTMLInputElement>(
          'input[data-field="definition"]'
        );
        defInput?.focus();
      } else {
        // Add new card
        addCard(rowNo);
      }
    }
  };

  const validateForm = () => {
    const validationError = validateFlashcardSet(title, cards);
    if (validationError) {
      assignError(validationError);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    assignError(null);

    if (!validateForm()) return;

    try {
      assignIsLoading(true);

      const trimmedCards = cards.map((card) => ({
        term: card.term.trim(),
        definition: card.definition.trim(),
        termImageUrl: card.termImageUrl,
        definitionImageUrl: card.definitionImageUrl,
      }));

      // Filter out empty cards
      const validCards = trimmedCards.filter((c) => c.term && c.definition);

      await createFlashcardSet(
        user.uid,
        title.trim(),
        description.trim(),
        validCards,
        visibility
      );

      router.push(ROUTES.FLASHCARDS.INDEX);
    } catch {
      assignError("Failed to create flashcard set. Please try again.");
    } finally {
      assignIsLoading(false);
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
              onChange={(e) => assignTitle(e.target.value)}
              placeholder="e.g., Biology Terms, Spanish Vocabulary"
              required
             
            />
          </FormField>

          <FormField label="Description (optional)">
            <TextArea
              value={description}
              onChange={(e) => assignDescription(e.target.value)}
              placeholder="Add a description to help others understand what this set covers"
              rows={2}
            />
          </FormField>

          <VisibilityField value={visibility} onChange={assignVisibility} />
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
          {cards.map((card, rowNo) => (
            <div
              key={rowNo}
              ref={(el) => {
                cardRefs.current[rowNo] = el;
              }}
              draggable
              onDragStart={() => handleDragStart(rowNo)}
              onDragOver={(e) => handleDragOver(e, rowNo)}
              onDragEnd={handleDragEnd}
              className={`group relative rounded-lg border border-border bg-card p-4 transition-all ${
                draggedIndex === rowNo ? "opacity-50 scale-[0.98]" : ""
              } ${
                draggedIndex !== null && draggedIndex !== rowNo
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
                  {rowNo + 1}
                </div>

                {/* Inputs */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={`card-term-${card.id ?? rowNo}`} className="block text-xs font-medium text-muted-foreground mb-1">
                      Term
                    </label>
                    <div className="flex gap-2">
                      <input
                        id={`card-term-${card.id ?? rowNo}`}
                        type="text"
                        data-field="term"
                        value={card.term}
                        onChange={(e) =>
                          handleCardChange(rowNo, "term", e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, rowNo, "term")}
                        placeholder="Enter term"
                        className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                      {user && (
                        <ImageUploadButton
                          imageUrl={card.termImageUrl}
                          onChange={(url) =>
                            handleImageChange(rowNo, "termImageUrl", url)
                          }
                          userId={user.uid}
                          setId={tempSetId}
                          cardId={`card_${rowNo}`}
                          side="term"
                        />
                      )}
                    </div>
                    {card.termImageUrl && (
                      <div className="mt-2 relative aspect-video max-w-[200px] rounded-lg overflow-hidden border">
                        <Image src={card.termImageUrl} alt="Term" width={200} height={112} className="w-full h-full object-contain" unoptimized />
                      </div>
                    )}
                  </div>
                  <div>
                    <label htmlFor={`card-def-${card.id ?? rowNo}`} className="block text-xs font-medium text-muted-foreground mb-1">
                      Definition
                    </label>
                    <div className="flex gap-2">
                      <input
                        id={`card-def-${card.id ?? rowNo}`}
                        type="text"
                        data-field="definition"
                        value={card.definition}
                        onChange={(e) =>
                          handleCardChange(rowNo, "definition", e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, rowNo, "definition")}
                        placeholder="Enter definition"
                        className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      />
                      {user && (
                        <ImageUploadButton
                          imageUrl={card.definitionImageUrl}
                          onChange={(url) =>
                            handleImageChange(rowNo, "definitionImageUrl", url)
                          }
                          userId={user.uid}
                          setId={tempSetId}
                          cardId={`card_${rowNo}`}
                          side="definition"
                        />
                      )}
                    </div>
                    {card.definitionImageUrl && (
                      <div className="mt-2 relative aspect-video max-w-[200px] rounded-lg overflow-hidden border">
                        <Image src={card.definitionImageUrl} alt="Definition" width={200} height={112} className="w-full h-full object-contain" unoptimized />
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
                    onClick={() => addCard(rowNo)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Add card below"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCard(rowNo)}
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

export default function CreateFlashcardSetClient() {
  return useCreateFlashcardSetClientModel();
}
