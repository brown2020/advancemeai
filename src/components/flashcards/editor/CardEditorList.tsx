"use client";

import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/common/UIComponents";
import { CardEditorRow } from "./CardEditorRow";
import {
  MIN_CARDS,
  createEditorCard,
  isCardFilled,
  type EditorCard,
  type ImageField,
  type TextField,
} from "./types";

interface CardEditorListProps {
  cards: EditorCard[];
  onCardsChange: React.Dispatch<React.SetStateAction<EditorCard[]>>;
  /** Reports a user-facing problem (e.g. trying to drop below the minimum). */
  onError: (message: string) => void;
  userId: string;
  /** Set ID used for image storage paths (a temp id before the set exists). */
  imageSetId: string;
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  if (item === undefined) return items;
  next.splice(to, 0, item);
  return next;
}

/** Numbered list of editable cards with add, remove and reorder controls. */
export function CardEditorList({
  cards,
  onCardsChange,
  onError,
  userId,
  imageSetId,
}: CardEditorListProps) {
  const listRef = useRef<HTMLOListElement>(null);
  const [draggedKey, setDraggedKey] = useState<string | null>(null);
  const [focusKey, setFocusKey] = useState<{ key: string; field: TextField } | null>(null);

  // Move focus to a newly added card (or a specific field) after render.
  useEffect(() => {
    if (!focusKey) return;
    const input = listRef.current?.querySelector<HTMLInputElement>(
      `[data-card-key="${focusKey.key}"] input[data-field="${focusKey.field}"]`
    );
    input?.focus();
    setFocusKey(null);
  }, [focusKey, cards]);

  const filledCount = cards.filter(isCardFilled).length;
  const canRemove = cards.length > MIN_CARDS;

  // Functional update keyed by id: an image upload finishing later must not
  // clobber text typed (or rows reordered) while it was in flight.
  const updateCard = (index: number, patch: Partial<EditorCard>) => {
    const id = cards[index]?.id;
    if (!id) return;
    onCardsChange((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const addCard = (afterIndex?: number) => {
    const card = createEditorCard();
    const insertAt = afterIndex === undefined ? cards.length : afterIndex + 1;
    const next = [...cards];
    next.splice(insertAt, 0, card);
    onCardsChange(next);
    setFocusKey({ key: card.key, field: "term" });
  };

  const removeCard = (index: number) => {
    if (!canRemove) {
      onError(`A flashcard set must have at least ${MIN_CARDS} cards`);
      return;
    }
    onCardsChange(cards.filter((_, i) => i !== index));
  };

  const moveCard = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    const card = cards[index];
    if (!card || target < 0 || target >= cards.length) return;
    onCardsChange(moveItem(cards, index, target));
  };

  const handleFieldKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
    field: TextField
  ) => {
    // Tab out of the last definition adds a new card.
    if (e.key === "Tab" && !e.shiftKey && field === "definition" && index === cards.length - 1) {
      e.preventDefault();
      addCard();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const card = cards[index];
      if (!card) return;
      if (field === "term") {
        setFocusKey({ key: card.key, field: "definition" });
      } else {
        addCard(index);
      }
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLElement>, key: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", key);
    const row = e.currentTarget.closest("li");
    if (row) e.dataTransfer.setDragImage(row, 24, 24);
    setDraggedKey(key);
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>, overIndex: number) => {
    if (draggedKey === null) return;
    e.preventDefault();
    const from = cards.findIndex((c) => c.key === draggedKey);
    if (from === -1 || from === overIndex) return;
    onCardsChange(moveItem(cards, from, overIndex));
  };

  return (
    <section aria-labelledby="cards-heading" className="mb-6">
      <SectionHeading
        title={
          <span id="cards-heading">
            Cards{" "}
            <span className="text-sm font-normal text-muted-foreground tabular-nums">
              {filledCount} of {cards.length} complete
            </span>
          </span>
        }
        action={
          <p className="hidden text-xs text-muted-foreground md:block">
            <kbd className="rounded-md border border-border bg-secondary px-1.5 py-0.5 font-mono">
              Enter
            </kbd>{" "}
            next field ·{" "}
            <kbd className="rounded-md border border-border bg-secondary px-1.5 py-0.5 font-mono">
              Tab
            </kbd>{" "}
            on the last card adds one
          </p>
        }
      />

      <ol ref={listRef} className="space-y-3">
        {cards.map((card, index) => (
          <CardEditorRow
            key={card.key}
            card={card}
            index={index}
            total={cards.length}
            canRemove={canRemove}
            isDragging={draggedKey === card.key}
            isDragActive={draggedKey !== null}
            userId={userId}
            imageSetId={imageSetId}
            onTextChange={(field: TextField, value) => updateCard(index, { [field]: value })}
            onImageChange={(field: ImageField, url) => updateCard(index, { [field]: url })}
            onFieldKeyDown={(e, field) => handleFieldKeyDown(e, index, field)}
            onInsertBelow={() => addCard(index)}
            onRemove={() => removeCard(index)}
            onMove={(direction) => moveCard(index, direction)}
            onDragStart={(e) => handleDragStart(e, card.key)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={() => setDraggedKey(null)}
          />
        ))}
      </ol>

      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={() => addCard()}
        className="mt-4 w-full border-dashed text-muted-foreground hover:text-primary"
      >
        <Plus aria-hidden />
        Add card
      </Button>
    </section>
  );
}
