"use client";

import React from "react";
import Link from "next/link";
import { FlashcardSet } from "@/types/flashcard";
import { ROUTES } from "@/constants/appConstants";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { useFlashcardStudyStore } from "@/stores/flashcard-study-store";

interface FlashcardSetCardProps {
  set: FlashcardSet;
  viewerUserId?: string;
}

const EMPTY_MASTERY: Record<string, 0 | 1 | 2 | 3> = Object.freeze({});

// Using React.memo to prevent unnecessary re-renders
export const FlashcardSetCard = React.memo(
  ({ set, viewerUserId }: FlashcardSetCardProps) => {
    // Format date once during render instead of in JSX
    const formattedDate = React.useMemo(
      () => new Date(set.createdAt).toLocaleDateString(),
      [set.createdAt]
    );

    const canShowProgress = Boolean(viewerUserId);
    const isOwner = Boolean(viewerUserId && viewerUserId === set.userId);

    const masteryByCardId = useFlashcardStudyStore((s) => {
      if (!viewerUserId) return EMPTY_MASTERY;
      const key = `${viewerUserId}:${set.id}`;
      return s.progressByUserSetKey[key]?.masteryByCardId ?? EMPTY_MASTERY;
    });

    const masteredCount = React.useMemo(() => {
      return set.cards.reduce((sum, c) => sum + (masteryByCardId[c.id] === 3 ? 1 : 0), 0);
    }, [masteryByCardId, set.cards]);

    const progressPct = React.useMemo(() => {
      if (!set.cards.length) return 0;
      return Math.round((masteredCount / set.cards.length) * 100);
    }, [masteredCount, set.cards.length]);

    return (
      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6 hover:shadow-md transition-shadow">
        <h2 className="text-xl font-semibold mb-2">{set.title}</h2>
        <p className="text-muted-foreground mb-4">
          {set.description}
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          {set.cards.length} cards • Created {formattedDate}
        </p>

        {canShowProgress && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Mastered</span>
              <span>
                {masteredCount}/{set.cards.length} ({progressPct}%)
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          <Link
            href={ROUTES.FLASHCARDS.SET(set.id)}
            className={cn(buttonVariants({ variant: "flashcard", size: "sm" }))}
          >
            Study
          </Link>
          {isOwner && (
            <Link
              href={ROUTES.FLASHCARDS.EDIT(set.id)}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Edit
            </Link>
          )}
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
      prevProps.set.createdAt === nextProps.set.createdAt &&
      prevProps.viewerUserId === nextProps.viewerUserId
    );
  }
);

FlashcardSetCard.displayName = "FlashcardSetCard";
