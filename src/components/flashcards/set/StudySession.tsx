"use client";

import { useMemo } from "react";
import type { FlashcardSet, StudyMode } from "@/types/flashcard";
import { LearnMode } from "@/components/flashcards/study/LearnMode";
import { MatchMode } from "@/components/flashcards/study/MatchMode";
import { TestMode } from "@/components/flashcards/study/TestMode";
import { WriteMode } from "@/components/flashcards/study/WriteMode";
import { StudyTopBar } from "@/components/flashcards/study/StudyTopBar";
import { StudySessionProvider } from "@/components/flashcards/study/StudySessionContext";
import type { MasteryLevel, MasteryMap } from "@/components/flashcards/study/study-utils";
import { FlashcardViewer } from "./FlashcardViewer";
import type { FlashcardDeck } from "./useFlashcardDeck";

type StudySessionProps = {
  mode: StudyMode;
  set: FlashcardSet;
  deck: FlashcardDeck;
  masteryByCardId: MasteryMap;
  starredIds: ReadonlySet<string>;
  onToggleStar: (cardId: string) => void;
  onSetMastery: (cardId: string, mastery: MasteryLevel) => void;
  onResetProgress: () => void;
  onSwitchMode: (mode: StudyMode) => void;
  onExit: () => void;
};

/** Focused, full-width study view for one mode. */
export function StudySession({
  mode,
  set,
  deck,
  masteryByCardId,
  starredIds,
  onToggleStar,
  onSetMastery,
  onResetProgress,
  onSwitchMode,
  onExit,
}: StudySessionProps) {
  const contextValue = useMemo(
    () => ({ mode, exit: onExit, switchMode: onSwitchMode }),
    [mode, onExit, onSwitchMode]
  );
  const cardsKey = set.cards.map((c) => c.id).join("|");

  return (
    <StudySessionProvider value={contextValue}>
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="sr-only">{set.title}</h1>
        {mode === "cards" ? (
          <div className="space-y-6">
            <StudyTopBar
              progress={deck.total ? ((deck.currentIndex + 1) / deck.total) * 100 : 0}
            />
            <FlashcardViewer
              deck={deck}
              isStarred={(id) => starredIds.has(id)}
              onToggleStar={onToggleStar}
              hasStarredCards={starredIds.size > 0}
              size="large"
            />
          </div>
        ) : null}

        {mode === "learn" ? (
          <LearnMode
            key={cardsKey}
            cards={set.cards}
            flashcardSetId={set.id}
            masteryByCardId={masteryByCardId}
            onSetMastery={onSetMastery}
            onResetProgress={onResetProgress}
          />
        ) : null}

        {mode === "write" ? (
          <WriteMode key={cardsKey} cards={set.cards} flashcardSetId={set.id} />
        ) : null}

        {mode === "match" ? (
          <MatchMode key={cardsKey} cards={set.cards} flashcardSetId={set.id} />
        ) : null}

        {mode === "test" ? (
          <TestMode key={cardsKey} cards={set.cards} flashcardSetId={set.id} />
        ) : null}
      </div>
    </StudySessionProvider>
  );
}
