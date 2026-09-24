"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/common/FormComponents";
import { cn } from "@/utils/cn";

type ContentType = "text" | "notes" | "transcript" | "article";

export interface StudyGuideRequest {
  content: string;
  title: string;
  contentType: ContentType;
  subject: string;
  generateFlashcards: boolean;
  generateQuestions: boolean;
}

export const MIN_CONTENT_LENGTH = 100;

const CONTENT_TYPES: { value: ContentType; label: string; description: string }[] = [
  { value: "notes", label: "Notes", description: "Class or lecture notes" },
  { value: "text", label: "Text", description: "Any general text" },
  { value: "article", label: "Article", description: "Article or chapter" },
  { value: "transcript", label: "Transcript", description: "Video or audio" },
];

interface StudyGuideFormProps {
  values: StudyGuideRequest;
  onChange: (patch: Partial<StudyGuideRequest>) => void;
  onSubmit: () => void;
}

/** Step 1: source material and generation options. */
export function StudyGuideForm({ values, onChange, onSubmit }: StudyGuideFormProps) {
  const length = values.content.length;
  const remaining = Math.max(0, MIN_CONTENT_LENGTH - length);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6"
    >
      <FormField label="Your notes or text" htmlFor="guide-content" required>
        <Textarea
          id="guide-content"
          value={values.content}
          onChange={(e) => onChange({ content: e.target.value })}
          placeholder="Paste class notes, a textbook section, an article, or a lecture transcript…"
          rows={12}
          className="min-h-56 resize-y"
          aria-describedby="guide-content-count"
        />
        <p
          id="guide-content-count"
          className={cn(
            "mt-1.5 text-xs tabular-nums",
            remaining > 0 ? "text-muted-foreground" : "text-success"
          )}
        >
          {length.toLocaleString()} characters
          {remaining > 0 ? ` · ${remaining} more needed` : " · ready"}
        </p>
      </FormField>

      <fieldset className="mb-5">
        <legend className="mb-1.5 text-sm font-semibold">What kind of material is it?</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup">
          {CONTENT_TYPES.map((type) => {
            const selected = values.contentType === type.value;
            return (
              <button
                key={type.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange({ contentType: type.value })}
                className={cn(
                  "min-h-11 rounded-xl border px-3 py-2 text-left transition-colors",
                  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15",
                  selected
                    ? "border-primary bg-accent"
                    : "border-border bg-card hover:border-primary/40 hover:bg-secondary/60"
                )}
              >
                <span className="block text-sm font-semibold">{type.label}</span>
                <span className="block text-xs text-muted-foreground">{type.description}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
        <FormField label="Title" htmlFor="guide-title" description="Optional. We'll suggest one.">
          <Input
            id="guide-title"
            value={values.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="e.g. Chapter 5: Cell Division"
          />
        </FormField>
        <FormField label="Subject" htmlFor="guide-subject" description="Optional. Helps the AI focus.">
          <Input
            id="guide-subject"
            value={values.subject}
            onChange={(e) => onChange({ subject: e.target.value })}
            placeholder="e.g. Biology, U.S. History"
          />
        </FormField>
      </div>

      <fieldset className="mb-6 space-y-2">
        <legend className="mb-1.5 text-sm font-semibold">Include</legend>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border px-3 py-2 hover:bg-secondary/60">
          <input
            type="checkbox"
            checked={values.generateFlashcards}
            onChange={(e) => onChange({ generateFlashcards: e.target.checked })}
            className="size-4 accent-primary"
          />
          <span className="text-sm">
            <span className="font-medium">Flashcards</span>
            <span className="text-muted-foreground"> — key terms you can save as a set</span>
          </span>
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border px-3 py-2 hover:bg-secondary/60">
          <input
            type="checkbox"
            checked={values.generateQuestions}
            onChange={(e) => onChange({ generateQuestions: e.target.checked })}
            className="size-4 accent-primary"
          />
          <span className="text-sm">
            <span className="font-medium">Practice questions</span>
            <span className="text-muted-foreground"> — check your understanding</span>
          </span>
        </label>
      </fieldset>

      <Button type="submit" size="lg" className="w-full" disabled={length < MIN_CONTENT_LENGTH}>
        <Sparkles aria-hidden />
        Generate study guide
      </Button>
    </form>
  );
}
