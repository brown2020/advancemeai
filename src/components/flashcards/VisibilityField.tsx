"use client";

import { Globe, Link as LinkIcon, Lock } from "lucide-react";
import type { FlashcardVisibility } from "@/types/flashcard";
import { FormField } from "@/components/common/FormComponents";

const VISIBILITY_OPTIONS: {
  value: FlashcardVisibility;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    value: "public",
    label: "Public",
    icon: <Globe className="h-4 w-4" aria-hidden />,
    description: "Anyone can find and study this set",
  },
  {
    value: "unlisted",
    label: "Unlisted",
    icon: <LinkIcon className="h-4 w-4" aria-hidden />,
    description: "Only people with the link can access",
  },
  {
    value: "private",
    label: "Private",
    icon: <Lock className="h-4 w-4" aria-hidden />,
    description: "Only you can see this set",
  },
];

type VisibilityFieldProps = {
  value: FlashcardVisibility;
  onChange: (value: FlashcardVisibility) => void;
};

export function VisibilityField({ value, onChange }: VisibilityFieldProps) {
  return (
    <FormField label="Visibility">
      <div
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        role="radiogroup"
        aria-label="Set visibility"
      >
        {VISIBILITY_OPTIONS.map((option) => {
          const isSelected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(option.value)}
              className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div
                className={`mt-0.5 ${
                  isSelected ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {option.icon}
              </div>
              <div>
                <div className="font-medium text-sm">{option.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {option.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </FormField>
  );
}
