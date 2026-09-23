"use client";

import { useRef } from "react";
import type { FlashcardSet, StudyMode } from "@/types/flashcard";
import { TermsList } from "@/components/flashcards/study/TermsList";
import { FlashcardViewer } from "./FlashcardViewer";
import { SetHeader } from "./SetHeader";
import { SetProgressCard } from "./SetProgressCard";
import { StudyModePicker } from "./StudyModePicker";
import type { FlashcardDeck } from "./useFlashcardDeck";
import type { SetAuthor } from "./useSetAuthor";

type SetOverviewProps = {
  set: FlashcardSet;
  author: SetAuthor | null;
  userId: string | null;
  isOwner: boolean;
  canCopy: boolean;
  isCopying: boolean;
  onCopy: () => void;
  deck: FlashcardDeck;
  starredIds: ReadonlySet<string>;
  masteredCount: number;
  onToggleStar: (cardId: string) => void;
  onResetProgress: () => void;
  onSelectMode: (mode: StudyMode) => void;
};

/** The set landing page: header, study modes, flashcard viewer, terms. */
export function SetOverview({
  set,
  author,
  userId,
  isOwner,
  canCopy,
  isCopying,
  onCopy,
  deck,
  starredIds,
  masteredCount,
  onToggleStar,
  onResetProgress,
  onSelectMode,
}: SetOverviewProps) {
  const viewerRef = useRef<HTMLDivElement>(null);

  const showCardInViewer = (cardId: string) => {
    if (!deck.goToCard(cardId)) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    viewerRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "center",
    });
  };

  return (
    <>
      <SetHeader
        set={set}
        author={author}
        userId={userId}
        isOwner={isOwner}
        canCopy={canCopy}
        isCopying={isCopying}
        onCopy={onCopy}
        onResetProgress={masteredCount > 0 ? onResetProgress : undefined}
      />

      <StudyModePicker onSelectMode={onSelectMode} className="mb-8" />

      <div ref={viewerRef} className="mx-auto max-w-3xl scroll-mt-24">
        <FlashcardViewer
          deck={deck}
          isStarred={(id) => starredIds.has(id)}
          onToggleStar={onToggleStar}
          hasStarredCards={starredIds.size > 0}
          onExpand={() => onSelectMode("cards")}
        />
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <TermsList
          cards={set.cards}
          starredCardIds={starredIds}
          onToggleStar={onToggleStar}
          onJumpToCard={showCardInViewer}
        />
        <aside className="order-first lg:sticky lg:top-24 lg:order-last">
          <SetProgressCard
            setId={set.id}
            masteredCount={masteredCount}
            totalCount={set.cards.length}
            timesStudied={set.timesStudied ?? 0}
            isSignedIn={Boolean(userId)}
          />
        </aside>
      </div>
    </>
  );
}
