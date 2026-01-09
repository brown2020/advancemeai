"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FlashcardSet } from "@/types/flashcard";
import { ROUTES } from "@/constants/appConstants";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { useFlashcardStudyStore } from "@/stores/flashcard-study-store";
import { createFlashcardSet } from "@/services/flashcardService";

interface FlashcardSetCardProps {
  set: FlashcardSet;
  viewerUserId?: string;
}

const EMPTY_MASTERY: Record<string, 0 | 1 | 2 | 3> = Object.freeze({});
const ANON_USER_ID = "anon";

// Using React.memo to prevent unnecessary re-renders
export const FlashcardSetCard = React.memo(
  ({ set, viewerUserId }: FlashcardSetCardProps) => {
    const router = useRouter();
    const [isDuplicating, setIsDuplicating] = React.useState(false);
    const [duplicateError, setDuplicateError] = React.useState<string | null>(
      null
    );

    // Format date once during render instead of in JSX
    const formattedDate = React.useMemo(
      () => new Date(set.createdAt).toLocaleDateString(),
      [set.createdAt]
    );

    const progressUserId = viewerUserId ?? ANON_USER_ID;
    const isOwner = Boolean(viewerUserId && viewerUserId === set.userId);
    const canDuplicate = Boolean(viewerUserId && !isOwner);

    const masteryByCardId = useFlashcardStudyStore((s) => {
      const key = `${progressUserId}:${set.id}`;
      return s.progressByUserSetKey[key]?.masteryByCardId ?? EMPTY_MASTERY;
    });

    const canShowProgress = React.useMemo(() => {
      if (viewerUserId) return true;
      // Only show progress for anonymous users if they have started studying this set.
      return Object.keys(masteryByCardId).length > 0;
    }, [masteryByCardId, viewerUserId]);

    const masteredCount = React.useMemo(() => {
      return set.cards.reduce((sum, c) => sum + (masteryByCardId[c.id] === 3 ? 1 : 0), 0);
    }, [masteryByCardId, set.cards]);

    const progressPct = React.useMemo(() => {
      if (!set.cards.length) return 0;
      return Math.round((masteredCount / set.cards.length) * 100);
    }, [masteredCount, set.cards.length]);

    const handleDuplicate = React.useCallback(async () => {
      if (!viewerUserId) return;
      if (isOwner) return;
      if (isDuplicating) return;

      setIsDuplicating(true);
      setDuplicateError(null);
      try {
        const newSetId = await createFlashcardSet(
          viewerUserId,
          `${set.title} (copy)`,
          set.description ?? "",
          set.cards.map((c) => ({ term: c.term, definition: c.definition })),
          false
        );
        router.push(ROUTES.FLASHCARDS.SET(newSetId));
      } catch (e) {
        setDuplicateError(
          e instanceof Error ? e.message : "Failed to duplicate set"
        );
      } finally {
        setIsDuplicating(false);
      }
    }, [
      isDuplicating,
      isOwner,
      router,
      set.cards,
      set.description,
      set.title,
      viewerUserId,
    ]);

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
          {canDuplicate && (
            <button
              type="button"
              onClick={handleDuplicate}
              disabled={isDuplicating}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                isDuplicating && "pointer-events-none opacity-60"
              )}
              aria-label="Duplicate this set"
            >
              {isDuplicating ? "Duplicating..." : "Duplicate"}
            </button>
          )}
        </div>

        {duplicateError && (
          <div className="mt-3 text-xs text-destructive">{duplicateError}</div>
        )}
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
