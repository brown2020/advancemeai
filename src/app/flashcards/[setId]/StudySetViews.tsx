"use client";

import { Layers } from "lucide-react";
import type { FlashcardSet, StudyMode } from "@/types/flashcard";
import { ROUTES } from "@/constants/appConstants";
import {
  ActionLink,
  EmptyState,
  ErrorDisplay,
  PageContainer,
} from "@/components/common/UIComponents";
import type { MasteryLevel, MasteryMap } from "@/components/flashcards/study/study-utils";
import { SetOverview } from "@/components/flashcards/set/SetOverview";
import { StudySession } from "@/components/flashcards/set/StudySession";
import type { FlashcardDeck } from "@/components/flashcards/set/useFlashcardDeck";
import type { SetAuthor } from "@/components/flashcards/set/useSetAuthor";
import { emptySetTitle, ownsFlashcardSet } from "./study-set-actions";

export function MissingFlashcardSet({ error }: { error: string | null }) {
  return (
    <PageContainer width="narrow">
      <ErrorDisplay message={missingSetMessage(error)} />
      <ActionLink href={ROUTES.FLASHCARDS.INDEX} variant="secondary">
        Back to Flashcards
      </ActionLink>
    </PageContainer>
  );
}

function missingSetMessage(error: string | null): string {
  return error || "Flashcard set not found.";
}

export function EmptyFlashcardSet({
  set,
  userId,
}: {
  set: FlashcardSet;
  userId: string | null;
}) {
  const isOwner = ownsFlashcardSet(userId, set.userId);
  return (
    <PageContainer width="narrow">
      <EmptyState
        icon={<Layers />}
        title={emptySetTitle(set.title)}
        message="This flashcard set doesn't have any cards yet."
        actionLink={emptySetActionHref(isOwner, set.id)}
        actionText={emptySetActionText(isOwner)}
      />
    </PageContainer>
  );
}

function emptySetActionHref(isOwner: boolean, setId: string): string {
  if (isOwner) return ROUTES.FLASHCARDS.EDIT(setId);
  return ROUTES.FLASHCARDS.INDEX;
}

function emptySetActionText(isOwner: boolean): string {
  if (isOwner) return "Add cards";
  return "Back to Flashcards";
}

type ActiveStudySessionProps = {
  activeMode: StudyMode | null;
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
  masteryByCardId: MasteryMap;
  onToggleStar: (cardId: string) => void;
  onSetMastery: (cardId: string, mastery: MasteryLevel) => void;
  onResetProgress: () => void;
  onSelectMode: (mode: StudyMode) => void;
  onExit: () => void;
};

export function ActiveStudySession({
  activeMode,
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
  masteryByCardId,
  onToggleStar,
  onSetMastery,
  onResetProgress,
  onSelectMode,
  onExit,
}: ActiveStudySessionProps) {
  if (activeMode) {
    return (
      <PageContainer className="py-4 md:py-6">
        <StudySession
          mode={activeMode}
          set={set}
          deck={deck}
          masteryByCardId={masteryByCardId}
          starredIds={starredIds}
          onToggleStar={onToggleStar}
          onSetMastery={onSetMastery}
          onResetProgress={onResetProgress}
          onSwitchMode={onSelectMode}
          onExit={onExit}
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
        onCopy={onCopy}
        deck={deck}
        starredIds={starredIds}
        masteredCount={masteredCount}
        onToggleStar={onToggleStar}
        onResetProgress={onResetProgress}
        onSelectMode={onSelectMode}
      />
    </PageContainer>
  );
}
