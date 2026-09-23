"use client";

import { Globe, Link as LinkIcon, Lock, type LucideIcon } from "lucide-react";
import type { FlashcardVisibility } from "@/types/flashcard";
import { FormField } from "@/components/common/FormComponents";
import { cn } from "@/utils/cn";

const VISIBILITY_OPTIONS: {
  value: FlashcardVisibility;
  label: string;
  icon: LucideIcon;
  description: string;
}[] = [
  {
    value: "public",
    label: "Public",
    icon: Globe,
    description: "Anyone can find and study it",
  },
  {
    value: "unlisted",
    label: "Unlisted",
    icon: LinkIcon,
    description: "Only people with the link",
  },
  {
    value: "private",
    label: "Private",
    icon: Lock,
    description: "Only you can see it",
  },
];

type VisibilityFieldProps = {
  value: FlashcardVisibility;
  onChange: (value: FlashcardVisibility) => void;
  className?: string;
};

export function VisibilityField({ value, onChange, className }: VisibilityFieldProps) {
  return (
    <FormField label="Who can see this set" className={cn("mb-0", className)}>
      <div
        className="grid grid-cols-1 gap-2 sm:grid-cols-3"
        role="radiogroup"
        aria-label="Set visibility"
      >
        {VISIBILITY_OPTIONS.map(({ value: optionValue, label, icon: Icon, description }) => {
          const isSelected = value === optionValue;
          return (
            <button
              key={optionValue}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(optionValue)}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15",
                isSelected
                  ? "border-primary bg-accent"
                  : "border-border bg-card hover:border-primary/40 hover:bg-secondary/60"
              )}
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                )}
              >
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{label}</span>
                <span className="block text-xs text-muted-foreground">{description}</span>
              </span>
            </button>
          );
        })}
      </div>
    </FormField>
  );
}
