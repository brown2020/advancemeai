"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import type { FlashcardSet, StudyMode } from "@/types/flashcard";
import { useFlashcardStudyStore } from "@/stores/flashcard-study-store";
import type { MasteryLevel } from "@/components/flashcards/study/study-utils";
import { SetPageSkeleton } from "@/components/flashcards/set/SetPageSkeleton";
import { useFlashcardDeck } from "@/components/flashcards/set/useFlashcardDeck";
import { useFlashcardSetData } from "@/components/flashcards/set/useFlashcardSetData";
import { useSetAuthor, type SetAuthor } from "@/components/flashcards/set/useSetAuthor";
import {
  copyStudySet,
  countMasteredCards,
  isDeckActive,
  ownsFlashcardSet,
  studySetIsReady,
  viewerCanCopySet,
} from "./study-set-actions";
import {
  ActiveStudySession,
  EmptyFlashcardSet,
  MissingFlashcardSet,
} from "./StudySetViews";

const NO_STARS: Record<string, true> = Object.freeze({});

type StudyFlashcardSetClientProps = {
  setId: string;
  initialSet?: FlashcardSet;
  /** Resolved on the server when possible; undefined means "look it up". */
  initialAuthor?: SetAuthor | null;
};

export default function StudyFlashcardSetClient({
  setId,
  initialSet,
  initialAuthor,
}: StudyFlashcardSetClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const userId = user?.uid ?? null;

  /** null = set page; otherwise the focused study mode. */
  const [activeMode, setActiveMode] = useState<StudyMode | null>(null);
  const [isCopying, setIsCopying] = useState(false);

  const { set, isLoading, error, masteryByCardId, progressUserId } = useFlashcardSetData({
    setId,
    initialSet,
    userId,
    refreshWhen: activeMode === null,
  });

  const starredMap = useFlashcardStudyStore((s) => s.starredBySetId[setId] ?? NO_STARS);
  const toggleStar = useFlashcardStudyStore((s) => s.toggleStar);
  const setMastery = useFlashcardStudyStore((s) => s.setMastery);
  const resetProgress = useFlashcardStudyStore((s) => s.resetProgress);

  const starredIds = useMemo(() => new Set(Object.keys(starredMap)), [starredMap]);

  const deck = useFlashcardDeck({
    set,
    starredIds,
    isActive: isDeckActive(activeMode),
  });

  const author = useSetAuthor(set?.userId, initialAuthor);

  const masteredCount = useMemo(
    () => countMasteredCards(masteryByCardId),
    [masteryByCardId]
  );

  const selectMode = useCallback((mode: StudyMode) => {
    setActiveMode(mode);
    window.scrollTo({ top: 0 });
  }, []);

  const exitMode = useCallback(() => {
    setActiveMode(null);
    window.scrollTo({ top: 0 });
  }, []);

  const handleToggleStar = useCallback(
    (cardId: string) => toggleStar(setId, cardId),
    [setId, toggleStar]
  );

  const handleSetMastery = useCallback(
    (cardId: string, mastery: MasteryLevel) =>
      setMastery(progressUserId, setId, cardId, mastery),
    [progressUserId, setId, setMastery]
  );

  const handleResetProgress = useCallback(
    () => resetProgress(progressUserId, setId),
    [progressUserId, resetProgress, setId]
  );

  const handleCopySet = useCallback(() => {
    void copyStudySet(userId, set, router, setIsCopying);
  }, [router, set, userId]);

  if (isLoading) {
    return <SetPageSkeleton />;
  }

  if (!studySetIsReady(error, set)) {
    return <MissingFlashcardSet error={error} />;
  }

  if (set.cards.length === 0) {
    return <EmptyFlashcardSet set={set} userId={userId} />;
  }

  const isOwner = ownsFlashcardSet(userId, set.userId);

  return (
    <ActiveStudySession
      activeMode={activeMode}
      set={set}
      author={author}
      userId={userId}
      isOwner={isOwner}
      canCopy={viewerCanCopySet(set, userId, isOwner)}
      isCopying={isCopying}
      onCopy={handleCopySet}
      deck={deck}
      starredIds={starredIds}
      masteredCount={masteredCount}
      masteryByCardId={masteryByCardId}
      onToggleStar={handleToggleStar}
      onSetMastery={handleSetMastery}
      onResetProgress={handleResetProgress}
      onSelectMode={selectMode}
      onExit={exitMode}
    />
  );
}
