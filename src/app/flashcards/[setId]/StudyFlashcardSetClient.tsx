"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Layers } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { FlashcardSet, StudyMode } from "@/types/flashcard";
import { createFlashcardSet } from "@/services/flashcardService";
import { ROUTES } from "@/constants/appConstants";
import {
  ActionLink,
  EmptyState,
  ErrorDisplay,
  PageContainer,
} from "@/components/common/UIComponents";
import { canCopyFlashcardSet } from "@/lib/flashcard-visibility";
import { useFlashcardStudyStore } from "@/stores/flashcard-study-store";
import type { MasteryLevel } from "@/components/flashcards/study/study-utils";
import { SetOverview } from "@/components/flashcards/set/SetOverview";
import { SetPageSkeleton } from "@/components/flashcards/set/SetPageSkeleton";
import { StudySession } from "@/components/flashcards/set/StudySession";
import { useFlashcardDeck } from "@/components/flashcards/set/useFlashcardDeck";
import { useFlashcardSetData } from "@/components/flashcards/set/useFlashcardSetData";
import { useSetAuthor, type SetAuthor } from "@/components/flashcards/set/useSetAuthor";

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
    isActive: activeMode === null || activeMode === "cards",
  });

  const author = useSetAuthor(set?.userId, initialAuthor);

  const masteredCount = useMemo(
    () => Object.values(masteryByCardId).filter((m) => m >= 3).length,
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

  const handleCopySet = useCallback(async () => {
    if (!userId || !set) return;
    setIsCopying(true);
    try {
      const newSetId = await createFlashcardSet(
        userId,
        `${set.title} (copy)`,
        set.description ?? "",
        set.cards.map((c) => ({ term: c.term, definition: c.definition })),
        "private"
      );
      router.push(ROUTES.FLASHCARDS.SET(newSetId));
    } catch {
      // no-op: the button simply re-enables.
    } finally {
      setIsCopying(false);
    }
  }, [router, set, userId]);

  if (isLoading) {
    return <SetPageSkeleton />;
  }

  if (error || !set) {
    return (
      <PageContainer width="narrow">
        <ErrorDisplay message={error || "Flashcard set not found."} />
        <ActionLink href={ROUTES.FLASHCARDS.INDEX} variant="secondary">
          Back to Flashcards
        </ActionLink>
      </PageContainer>
    );
  }

  if (set.cards.length === 0) {
    const isOwnerOfEmpty = Boolean(userId && userId === set.userId);
    return (
      <PageContainer width="narrow">
        <EmptyState
          icon={<Layers />}
          title={set.title || "This set is empty"}
          message="This flashcard set doesn't have any cards yet."
          actionLink={
            isOwnerOfEmpty ? ROUTES.FLASHCARDS.EDIT(set.id) : ROUTES.FLASHCARDS.INDEX
          }
          actionText={isOwnerOfEmpty ? "Add cards" : "Back to Flashcards"}
        />
      </PageContainer>
    );
  }

  const isOwner = Boolean(userId && userId === set.userId);
  const canCopy = Boolean(userId && canCopyFlashcardSet(set, userId)) && !isOwner;

  if (activeMode) {
    return (
      <PageContainer className="py-4 md:py-6">
        <StudySession
          mode={activeMode}
          set={set}
          deck={deck}
          masteryByCardId={masteryByCardId}
          starredIds={starredIds}
          onToggleStar={handleToggleStar}
          onSetMastery={handleSetMastery}
          onResetProgress={handleResetProgress}
          onSwitchMode={selectMode}
          onExit={exitMode}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <SetOverview
        set={set}
        author={author}
        userId={userId}
        isOwner={isOwner}
        canCopy={canCopy}
        isCopying={isCopying}
        onCopy={() => void handleCopySet()}
        deck={deck}
        starredIds={starredIds}
        masteredCount={masteredCount}
        onToggleStar={handleToggleStar}
        onResetProgress={handleResetProgress}
        onSelectMode={selectMode}
      />
    </PageContainer>
  );
}
