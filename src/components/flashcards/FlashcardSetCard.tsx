"use client";

import { memo, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Globe, Link2, Lock, Pencil } from "lucide-react";
import type { FlashcardSet, FlashcardVisibility } from "@/types/flashcard";
import { ROUTES } from "@/constants/appConstants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { useFlashcardStudyStore } from "@/stores/flashcard-study-store";
import { canCopyFlashcardSet } from "@/lib/flashcard-visibility";
import { createFlashcardSet } from "@/services/flashcardService";
import { SetCardFrame } from "@/components/flashcards/library/SetCardFrame";

interface FlashcardSetCardProps {
  set: FlashcardSet;
  viewerUserId?: string;
  /** Extra secondary controls (e.g. folder menu) shown in the card's action area. */
  actions?: React.ReactNode;
}

type MasteryMap = Record<string, 0 | 1 | 2 | 3>;

const EMPTY_MASTERY: MasteryMap = Object.freeze({}) as MasteryMap;
const ANON_USER_ID = "anon";

const VISIBILITY_META: Record<
  FlashcardVisibility,
  { label: string; icon: typeof Globe }
> = {
  public: { label: "Public", icon: Globe },
  unlisted: { label: "Unlisted", icon: Link2 },
  private: { label: "Private", icon: Lock },
};

function resolveVisibility(set: FlashcardSet): FlashcardVisibility {
  return set.visibility ?? (set.isPublic ? "public" : "private");
}

export const FlashcardSetCard = memo(function FlashcardSetCard({
  set,
  viewerUserId,
  actions,
}: FlashcardSetCardProps) {
  const router = useRouter();
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  const progressUserId = viewerUserId ?? ANON_USER_ID;
  const isOwner = Boolean(viewerUserId && viewerUserId === set.userId);
  const canDuplicate = Boolean(
    viewerUserId && !isOwner && canCopyFlashcardSet(set, viewerUserId)
  );

  const masteryByCardId = useFlashcardStudyStore(
    (s) =>
      s.progressByUserSetKey[`${progressUserId}:${set.id}`]?.masteryByCardId ??
      EMPTY_MASTERY
  );

  // Only show mastery once the viewer has actually studied this set.
  const progress = useMemo(() => {
    if (Object.keys(masteryByCardId).length === 0) return null;
    const mastered = set.cards.reduce(
      (sum, c) => sum + (masteryByCardId[c.id] === 3 ? 1 : 0),
      0
    );
    return { mastered, total: set.cards.length };
  }, [masteryByCardId, set.cards]);

  const handleDuplicate = useCallback(async () => {
    if (!viewerUserId || isOwner || isDuplicating) return;

    setIsDuplicating(true);
    setDuplicateError(null);
    try {
      const newSetId = await createFlashcardSet(
        viewerUserId,
        `${set.title} (copy)`,
        set.description ?? "",
        set.cards.map((c) => ({ term: c.term, definition: c.definition })),
        "private"
      );
      router.push(ROUTES.FLASHCARDS.SET(newSetId));
    } catch (e) {
      setDuplicateError(
        e instanceof Error ? e.message : "Failed to duplicate set"
      );
    } finally {
      setIsDuplicating(false);
    }
  }, [isDuplicating, isOwner, router, set, viewerUserId]);

  const visibility = VISIBILITY_META[resolveVisibility(set)];
  const VisibilityIcon = visibility.icon;

  return (
    <SetCardFrame
      href={ROUTES.FLASHCARDS.SET(set.id)}
      title={set.title}
      description={set.description}
      termCount={set.cards.length}
      updatedAt={set.updatedAt || set.createdAt}
      progress={progress}
      badges={
        isOwner ? (
          <Badge variant="outline">
            <VisibilityIcon aria-hidden />
            {visibility.label}
          </Badge>
        ) : set.copiedFromSetId ? (
          <Badge variant="outline">Copy</Badge>
        ) : null
      }
      actions={
        <>
          {actions}
          {isOwner && (
            <Link
              href={ROUTES.FLASHCARDS.EDIT(set.id)}
              className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
              aria-label={`Edit ${set.title}`}
              title="Edit set"
            >
              <Pencil />
            </Link>
          )}
          {canDuplicate && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleDuplicate}
              isLoading={isDuplicating}
              aria-label={`Duplicate ${set.title} to your library`}
              title="Make a copy"
            >
              {!isDuplicating && <Copy />}
            </Button>
          )}
        </>
      }
      footer={
        duplicateError ? (
          <p role="alert" className="text-xs text-destructive">
            {duplicateError}
          </p>
        ) : null
      }
    />
  );
});
