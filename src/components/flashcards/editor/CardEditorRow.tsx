"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUploadButton } from "@/components/flashcards/ImageUpload";
import { cn } from "@/utils/cn";
import type { EditorCard, ImageField, TextField } from "./types";

const SIDES: { field: TextField; imageField: ImageField; label: string; placeholder: string }[] = [
  { field: "term", imageField: "termImageUrl", label: "Term", placeholder: "Enter term" },
  {
    field: "definition",
    imageField: "definitionImageUrl",
    label: "Definition",
    placeholder: "Enter definition",
  },
];

export interface CardEditorRowProps {
  card: EditorCard;
  index: number;
  total: number;
  canRemove: boolean;
  isDragging: boolean;
  isDragActive: boolean;
  userId: string;
  imageSetId: string;
  onTextChange: (field: TextField, value: string) => void;
  onImageChange: (field: ImageField, url: string | undefined) => void;
  onFieldKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, field: TextField) => void;
  onInsertBelow: () => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  onDragStart: (e: React.DragEvent<HTMLElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
}

/** One numbered term/definition row in the set editor. */
export function CardEditorRow({
  card,
  index,
  total,
  canRemove,
  isDragging,
  isDragActive,
  userId,
  imageSetId,
  onTextChange,
  onImageChange,
  onFieldKeyDown,
  onInsertBelow,
  onRemove,
  onMove,
  onDragStart,
  onDragOver,
  onDragEnd,
}: CardEditorRowProps) {
  const [imageError, setImageError] = useState<string | null>(null);
  const number = index + 1;

  return (
    <li
      data-card-key={card.key}
      onDragOver={onDragOver}
      className={cn(
        "group rounded-2xl border border-border bg-card shadow-card transition-[opacity,transform,border-color]",
        isDragging && "scale-[0.99] opacity-50",
        isDragActive && !isDragging && "border-dashed"
      )}
    >
      <div className="flex items-center gap-1 border-b border-border px-3 py-1.5 sm:px-4">
        <span
          className="mr-1 flex size-7 items-center justify-center rounded-lg bg-secondary text-xs font-bold tabular-nums text-muted-foreground"
          aria-hidden
        >
          {number}
        </span>
        <span className="sr-only">Card {number}</span>
        <span
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          className="hidden size-10 cursor-grab items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground active:cursor-grabbing sm:flex"
          title="Drag to reorder"
          aria-hidden
        >
          <GripVertical className="size-4" />
        </span>

        <div className="ml-auto flex items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            aria-label={`Move card ${number} up`}
            className="text-muted-foreground"
          >
            <ArrowUp />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            aria-label={`Move card ${number} down`}
            className="text-muted-foreground"
          >
            <ArrowDown />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onInsertBelow}
            aria-label={`Add card below card ${number}`}
            className="text-muted-foreground"
          >
            <Plus />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            disabled={!canRemove}
            aria-label={`Delete card ${number}`}
            title={canRemove ? undefined : "A set needs at least 2 cards"}
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 md:grid-cols-2 md:gap-6">
        {SIDES.map(({ field, imageField, label, placeholder }) => {
          const inputId = `card-${card.key}-${field}`;
          const imageUrl = card[imageField];
          return (
            <div key={field} className="min-w-0">
              <div className="flex gap-2">
                <Input
                  id={inputId}
                  data-field={field}
                  value={card[field]}
                  onChange={(e) => onTextChange(field, e.target.value)}
                  onKeyDown={(e) => onFieldKeyDown(e, field)}
                  placeholder={placeholder}
                  autoComplete="off"
                />
                <ImageUploadButton
                  imageUrl={imageUrl}
                  onChange={(url) => {
                    setImageError(null);
                    onImageChange(imageField, url);
                  }}
                  onError={setImageError}
                  userId={userId}
                  setId={imageSetId}
                  cardId={card.id ?? card.key}
                  side={field}
                />
              </div>
              <label
                htmlFor={inputId}
                className="mt-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {label}
              </label>
              {imageUrl && (
                <div className="relative mt-2 aspect-video w-full max-w-[200px] overflow-hidden rounded-xl border border-border bg-secondary">
                  <Image
                    src={imageUrl}
                    alt={`${label} image for card ${number}`}
                    width={200}
                    height={112}
                    className="size-full object-contain"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => onImageChange(imageField, undefined)}
                    aria-label={`Remove ${field} image from card ${number}`}
                    className="absolute right-1.5 top-1.5 flex size-8 items-center justify-center rounded-full bg-foreground/70 text-background transition-colors hover:bg-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {imageError && (
        <p role="alert" className="px-4 pb-4 text-xs text-destructive sm:px-5">
          {imageError}
        </p>
      )}
    </li>
  );
}
