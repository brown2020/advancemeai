"use client";

import Link from "next/link";
import type { FlashcardSet, StudyMode } from "@/types/flashcard";
import {
  VISIBILITY_LABELS,
  normalizeVisibility,
} from "@/lib/flashcard-visibility";
import { ROUTES } from "@/constants/appConstants";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { StudyModeGrid } from "@/components/flashcards/study/StudyModeGrid";
import { ProgressBar } from "@/components/flashcards/study/ProgressRing";
import { TermsList } from "@/components/flashcards/study/TermsList";
import { AddSetToFolderControl } from "@/components/flashcards/AddSetToFolderControl";
import { AddSetToClassControl } from "@/components/flashcards/AddSetToClassControl";
import { ShareModal } from "@/components/sharing/ShareModal";
import {
  Copy,
  Edit3,
  Globe,
  Link as LinkIcon,
  Lock,
  RotateCcw,
  Shuffle,
} from "lucide-react";

const VISIBILITY_ICONS = {
  public: Globe,
  unlisted: LinkIcon,
  private: Lock,
} as const;

type SetLandingOverviewProps = {
  set: FlashcardSet;
  isOwner: boolean;
  canCopy: boolean;
  userId: string | null;
  masteredCount: number;
  progressPercent: number;
  starredCardIds: Set<string>;
  activeCardIds: string[];
  onSelectMode: (mode: StudyMode) => void;
  onToggleStar: (cardId: string) => void;
  onJumpToCard: (cardId: string) => void;
  onShuffleAndStudy: () => void;
  onResetProgress: () => void;
  onCopySet: () => void;
  isCopying?: boolean;
};

export function SetLandingOverview({
  set,
  isOwner,
  canCopy,
  userId,
  masteredCount,
  progressPercent,
  starredCardIds,
  activeCardIds,
  onSelectMode,
  onToggleStar,
  onJumpToCard,
  onShuffleAndStudy,
  onResetProgress,
  onCopySet,
  isCopying = false,
}: SetLandingOverviewProps) {
  const visibility = normalizeVisibility({
    visibility: set.visibility,
    isPublic: set.isPublic,
  });
  const VisibilityIcon = VISIBILITY_ICONS[visibility];
  const timesStudied = set.timesStudied ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-3 min-w-0">
          <p className="text-xs text-muted-foreground">Terms</p>
          <p className="text-lg font-semibold tabular-nums">{set.cards.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 min-w-0">
          <p className="text-xs text-muted-foreground">Times studied</p>
          <p className="text-lg font-semibold tabular-nums">{timesStudied}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 min-w-0">
          <p className="text-xs text-muted-foreground">Mastered</p>
          <p className="text-lg font-semibold tabular-nums">
            {masteredCount}/{set.cards.length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 min-w-0">
          <p className="text-xs text-muted-foreground">Visibility</p>
          <p className="text-sm font-medium inline-flex items-center gap-1 mt-1">
            <VisibilityIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {VISIBILITY_LABELS[visibility]}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h2 className="text-lg font-semibold">Your progress</h2>
          <span className="text-sm text-muted-foreground tabular-nums">
            {progressPercent}%
          </span>
        </div>
        <ProgressBar progress={progressPercent} showLabel={false} size="md" />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Choose a study mode</h2>
        <StudyModeGrid onSelectMode={onSelectMode} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="practice" size="sm" onClick={onShuffleAndStudy}>
          <Shuffle className="h-4 w-4 mr-2" aria-hidden />
          Shuffle &amp; study
        </Button>
        {masteredCount > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResetProgress}
          >
            <RotateCcw className="h-4 w-4 mr-2" aria-hidden />
            Reset progress
          </Button>
        ) : null}
      </div>

      {isOwner && userId ? (
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <h3 className="font-semibold text-sm">Organize &amp; share</h3>
          <div className="flex flex-wrap gap-2">
            <ShareModal title={set.title} url={`/flashcards/${set.id}`} />
            <Link
              href={ROUTES.FLASHCARDS.EDIT(set.id)}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Edit3 className="h-4 w-4 mr-2" aria-hidden />
              Edit set
            </Link>
            <Link
              href={ROUTES.FLASHCARDS.EDIT(set.id)}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Change visibility
            </Link>
          </div>
          <AddSetToFolderControl userId={userId} setId={set.id} />
          <AddSetToClassControl userId={userId} setId={set.id} />
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <ShareModal title={set.title} url={`/flashcards/${set.id}`} />
          {canCopy ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCopySet}
              disabled={isCopying || !userId}
            >
              <Copy className="h-4 w-4 mr-2" aria-hidden />
              {isCopying ? "Copying…" : "Copy to my library"}
            </Button>
          ) : null}
        </div>
      )}

      <TermsList
        cards={set.cards}
        starredCardIds={starredCardIds}
        onToggleStar={onToggleStar}
        onJumpToCard={(cardId) => {
          const idx = activeCardIds.indexOf(cardId);
          if (idx >= 0) onJumpToCard(cardId);
        }}
      />
    </div>
  );
}
