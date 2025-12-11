"use client";

import React from "react";
import Link from "next/link";
import { FlashcardSet } from "@/types/flashcard";
import { ROUTES } from "@/constants/appConstants";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/utils/cn";

interface FlashcardSetCardProps {
  set: FlashcardSet;
}

// Using React.memo to prevent unnecessary re-renders
export const FlashcardSetCard = React.memo(
  ({ set }: FlashcardSetCardProps) => {
    // Format date once during render instead of in JSX
    const formattedDate = React.useMemo(
      () => new Date(set.createdAt).toLocaleDateString(),
      [set.createdAt]
    );

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
        <h2 className="text-xl font-semibold mb-2">{set.title}</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {set.description}
        </p>
        <p className="text-sm text-gray-500 mb-4">
          {set.cards.length} cards • Created {formattedDate}
        </p>
        <div className="flex space-x-2">
          <Link
            href={ROUTES.FLASHCARDS.SET(set.id)}
            className={cn(buttonVariants({ variant: "flashcard", size: "sm" }))}
          >
            Study
          </Link>
          <Link
            href={ROUTES.FLASHCARDS.EDIT(set.id)}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Edit
          </Link>
        </div>
      </div>
    );
  },
  // Custom comparison function to determine if component should re-render
  (prevProps, nextProps) => {
    // Only re-render if any of these properties change
    return (
      prevProps.set.id === nextProps.set.id &&
      prevProps.set.title === nextProps.set.title &&
      prevProps.set.description === nextProps.set.description &&
      prevProps.set.cards.length === nextProps.set.cards.length &&
      prevProps.set.createdAt === nextProps.set.createdAt
    );
  }
);

FlashcardSetCard.displayName = "FlashcardSetCard";
