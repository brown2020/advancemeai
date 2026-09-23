"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Flashcard, FlashcardSet } from "@/types/flashcard";
import {
  DEFAULT_SETTINGS,
  type FlashcardStudySettings,
} from "@/components/flashcards/study/FlashcardSettings";
import {
  isInteractiveKeyTarget,
  isTextEntryTarget,
  shuffle,
} from "@/components/flashcards/study/study-utils";

type UseFlashcardDeckOptions = {
  set: FlashcardSet | null;
  starredIds: ReadonlySet<string>;
  /** Enables ←/→/Space shortcuts and autoplay. */
  isActive: boolean;
};

export type FlashcardDeck = ReturnType<typeof useFlashcardDeck>;

/**
 * State for the flashcard viewer: card order (shuffle), starred filter,
 * current position, flip state, autoplay and keyboard shortcuts.
 */
export function useFlashcardDeck({ set, starredIds, isActive }: UseFlashcardDeckOptions) {
  const [settings, setSettings] = useState<FlashcardStudySettings>(DEFAULT_SETTINGS);
  /** Explicit shuffled order; null means the set's natural order. */
  const [order, setOrder] = useState<string[] | null>(null);
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);

  const cards = useMemo(() => set?.cards ?? [], [set?.cards]);
  const cardById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  const orderedIds = useMemo(
    () => (order ? order.filter((id) => cardById.has(id)) : cards.map((c) => c.id)),
    [cardById, cards, order]
  );
  const deckIds = useMemo(
    () =>
      settings.starredOnly ? orderedIds.filter((id) => starredIds.has(id)) : orderedIds,
    [orderedIds, settings.starredOnly, starredIds]
  );

  const total = deckIds.length;
  const currentIndex = Math.min(index, Math.max(0, total - 1));
  const currentId = deckIds[currentIndex];
  const currentCard: Flashcard | null = currentId ? cardById.get(currentId) ?? null : null;

  const next = useCallback(() => {
    if (currentIndex < total - 1) {
      setIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  }, [currentIndex, total]);

  const prev = useCallback(() => {
    if (currentIndex > 0) {
      setIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const flip = useCallback(() => setIsFlipped((f) => !f), []);

  const naturalOrder = useCallback(() => cards.map((c) => c.id), [cards]);

  const updateSettings = useCallback(
    (nextSettings: FlashcardStudySettings) => {
      if (nextSettings.shuffle !== settings.shuffle) {
        setOrder(nextSettings.shuffle ? shuffle(naturalOrder()) : null);
        setIndex(0);
        setIsFlipped(false);
      }
      if (nextSettings.starredOnly !== settings.starredOnly) {
        setIndex(0);
        setIsFlipped(false);
      }
      setSettings(nextSettings);
    },
    [naturalOrder, settings.shuffle, settings.starredOnly]
  );

  const toggleShuffle = useCallback(() => {
    updateSettings({ ...settings, shuffle: !settings.shuffle });
  }, [settings, updateSettings]);

  /** Back to the first card; reshuffles when shuffle is on. */
  const restart = useCallback(() => {
    setOrder(settings.shuffle ? shuffle(naturalOrder()) : null);
    setIndex(0);
    setIsFlipped(false);
  }, [naturalOrder, settings.shuffle]);

  /**
   * Show a specific card (term side). Turns off "starred only" when that
   * filter hides the card. Returns false when the card isn't in the set.
   */
  const goToCard = useCallback(
    (cardId: string) => {
      let idx = deckIds.indexOf(cardId);
      if (idx < 0 && settings.starredOnly) {
        idx = orderedIds.indexOf(cardId);
        if (idx >= 0) setSettings((s) => ({ ...s, starredOnly: false }));
      }
      if (idx < 0) return false;
      setIndex(idx);
      setIsFlipped(false);
      return true;
    },
    [deckIds, orderedIds, settings.starredOnly]
  );

  // Keyboard shortcuts: ←/→ navigate, Space/Enter flip.
  useEffect(() => {
    if (!isActive) return;
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTextEntryTarget(e.target)) return;
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if ((e.key === " " || e.key === "Enter") && !isInteractiveKeyTarget(e.target)) {
        e.preventDefault();
        flip();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flip, isActive, next, prev]);

  // Autoplay: flip, then advance, until the last card.
  useEffect(() => {
    if (
      !isActive ||
      !settings.autoplay ||
      isAutoplayPaused ||
      currentIndex >= total - 1
    ) {
      return;
    }
    const timer = setTimeout(() => {
      if (!isFlipped) setIsFlipped(true);
      else next();
    }, settings.autoplaySpeed * 1000);
    return () => clearTimeout(timer);
  }, [
    currentIndex,
    isActive,
    isAutoplayPaused,
    isFlipped,
    next,
    settings.autoplay,
    settings.autoplaySpeed,
    total,
  ]);

  return {
    settings,
    updateSettings,
    toggleShuffle,
    currentCard,
    currentIndex,
    total,
    isFlipped,
    flip,
    next,
    prev,
    restart,
    goToCard,
    isAutoplayPaused,
    toggleAutoplayPaused: () => setIsAutoplayPaused((p) => !p),
  };
}
