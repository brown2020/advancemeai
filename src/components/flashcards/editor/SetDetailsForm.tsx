"use client";

import type { FlashcardVisibility } from "@/types/flashcard";
import { FormField } from "@/components/common/FormComponents";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { VisibilityField } from "@/components/flashcards/VisibilityField";

interface SetDetailsFormProps {
  title: string;
  description: string;
  visibility: FlashcardVisibility;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onVisibilityChange: (value: FlashcardVisibility) => void;
}

/** Title, description and visibility for a flashcard set. */
export function SetDetailsForm({
  title,
  description,
  visibility,
  onTitleChange,
  onDescriptionChange,
  onVisibilityChange,
}: SetDetailsFormProps) {
  return (
    <section
      aria-label="Set details"
      className="mb-8 rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6"
    >
      <FormField label="Title" htmlFor="set-title" required>
        <Input
          id="set-title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="e.g. Biology: Cell Structure, Spanish Unit 3 Vocab"
          required
          autoComplete="off"
          className="h-12 text-base font-semibold"
        />
      </FormField>

      <FormField label="Description" htmlFor="set-description" description="Optional. Helps others know what this set covers.">
        <Textarea
          id="set-description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Add a short description"
          rows={2}
          className="min-h-16"
        />
      </FormField>

      <VisibilityField value={visibility} onChange={onVisibilityChange} />
    </section>
  );
}
