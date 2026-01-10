"use client";

import { useAuth } from "@/lib/auth";
import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FlashcardSet, StudyMode } from "@/types/flashcard";
import { createFlashcardSet, getFlashcardSet } from "@/services/flashcardService";
import {
  getFlashcardStudyProgress,
  saveFlashcardStudyProgress,
} from "@/services/flashcardStudyService";
import { ROUTES } from "@/constants/appConstants";
import {
  PageContainer,
  LoadingState,
  ErrorDisplay,
  ActionLink,
} from "@/components/common/UIComponents";
import { Button } from "@/components/ui/button";
import { Star, Shuffle, Link as LinkIcon, RotateCcw } from "lucide-react";
import { StudyModeTabs } from "@/components/flashcards/study/StudyModeTabs";
import { TermsList } from "@/components/flashcards/study/TermsList";
import { LearnMode } from "@/components/flashcards/study/LearnMode";
import { TestMode } from "@/components/flashcards/study/TestMode";
import { shuffle } from "@/components/flashcards/study/study-utils";
import { useFlashcardStudyStore } from "@/stores/flashcard-study-store";
import { useFlashcardLibraryStore } from "@/stores/flashcard-library-store";
import { cn } from "@/utils/cn";

const EMPTY_MASTERY: Record<string, 0 | 1 | 2 | 3> = Object.freeze({});
const ANON_USER_ID = "anon";

function mergeMastery(
  a: Record<string, 0 | 1 | 2 | 3>,
  b: Record<string, 0 | 1 | 2 | 3>
): Record<string, 0 | 1 | 2 | 3> {
  const merged: Record<string, 0 | 1 | 2 | 3> = { ...a };
  for (const [cardId, mastery] of Object.entries(b)) {
    const current = merged[cardId] ?? 0;
    merged[cardId] = (Math.max(current, mastery) as 0 | 1 | 2 | 3);
  }
  return merged;
}

function isSameMastery(
  a: Record<string, 0 | 1 | 2 | 3>,
  b: Record<string, 0 | 1 | 2 | 3>
) {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const k of aKeys) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

// Flashcard component
const Flashcard = ({
  term,
  definition,
  isFlipped,
  onFlip,
}: {
  term: string;
  definition: string;
  isFlipped: boolean;
  onFlip: () => void;
}) => (
  <div
    className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-8 mb-6 min-h-[300px] flex items-center justify-center cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    onClick={onFlip}
    role="button"
    tabIndex={0}
    aria-label={`Flashcard: ${isFlipped ? "definition" : "term"}`}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        onFlip();
        e.preventDefault();
      }
    }}
    style={{ perspective: "1000px" }}
  >
    {isFlipped ? (
      <div className="w-full text-center transition-transform duration-500">
        <h2 className="text-2xl font-bold mb-2">{definition}</h2>
        <p className="text-muted-foreground text-sm mt-4">Click to see term</p>
      </div>
    ) : (
      <div className="w-full text-center transition-transform duration-500">
        <h2 className="text-2xl font-bold mb-2">{term}</h2>
        <p className="text-muted-foreground text-sm mt-4">
          Click to see definition
        </p>
      </div>
    )}
  </div>
);

// Navigation Controls
const NavigationControls = ({
  onPrev,
  onNext,
  isFirst,
  isLast,
}: {
  onPrev: () => void;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}) => (
  <div className="flex justify-between">
    <Button onClick={onPrev} disabled={isFirst} variant="outline">
      Previous
    </Button>
    <Button onClick={onNext} disabled={isLast} variant="practice">
      Next
    </Button>
  </div>
);

// Cards Study Mode
const CardStudyMode = ({
  currentCard,
  currentIndex,
  totalCards,
  isFlipped,
  onFlip,
  onPrev,
  onNext,
}: {
  currentCard: { term: string; definition: string } | null;
  currentIndex: number;
  totalCards: number;
  isFlipped: boolean;
  onFlip: () => void;
  onPrev: () => void;
  onNext: () => void;
}) => {
  if (!currentCard) return null;

  return (
    <>
      <div className="mb-4 text-center">
        <span className="text-muted-foreground">
          Card {currentIndex + 1} of {totalCards}
        </span>
      </div>

      <Flashcard
        term={currentCard.term}
        definition={currentCard.definition}
        isFlipped={isFlipped}
        onFlip={onFlip}
      />

      <NavigationControls
        onPrev={onPrev}
        onNext={onNext}
        isFirst={currentIndex === 0}
        isLast={currentIndex === totalCards - 1}
      />
    </>
  );
};

export default function StudyFlashcardSetClient({
  setId,
  initialSet,
}: {
  setId: string;
  initialSet?: FlashcardSet;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const userId = user?.uid ?? null;
  const progressUserId = userId ?? ANON_USER_ID;
  const progressKey = useMemo(
    () => `${progressUserId}:${setId}`,
    [progressUserId, setId]
  );

  const [set, setSet] = useState<FlashcardSet | null>(null);
  const [activeCardIds, setActiveCardIds] = useState<string[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studyMode, setStudyMode] = useState<StudyMode>("cards");
  const [hasShuffled, setHasShuffled] = useState(false);

  const isStarred = useFlashcardStudyStore((s) => s.isStarred);
  const toggleStar = useFlashcardStudyStore((s) => s.toggleStar);
  const getProgress = useFlashcardStudyStore((s) => s.getProgress);
  const hydrateProgress = useFlashcardStudyStore((s) => s.hydrateProgress);
  const setMastery = useFlashcardStudyStore((s) => s.setMastery);
  const resetProgress = useFlashcardStudyStore((s) => s.resetProgress);
  const addRecentSet = useFlashcardLibraryStore((s) => s.addRecentSet);

  const hasHydratedFromServerRef = useRef(false);
  const saveDebounceRef = useRef<number | null>(null);

  const masteryByCardId = useFlashcardStudyStore((s) => {
    return s.progressByUserSetKey[progressKey]?.masteryByCardId ?? EMPTY_MASTERY;
  });

  // Navigation callbacks
  const nextCard = useCallback(() => {
    if (activeCardIds.length && currentCardIndex < activeCardIds.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    }
  }, [activeCardIds.length, currentCardIndex]);

  const prevCard = useCallback(() => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  }, [currentCardIndex]);

  const flipCard = useCallback(() => {
    setIsFlipped(!isFlipped);
  }, [isFlipped]);

  const cardById = useMemo(() => {
    return new Map((set?.cards ?? []).map((c) => [c.id, c]));
  }, [set?.cards]);

  // Get current card
  const currentCard = useMemo(() => {
    const id = activeCardIds[currentCardIndex];
    return id ? cardById.get(id) ?? null : null;
  }, [activeCardIds, cardById, currentCardIndex]);

  // Fetch flashcard set
  useEffect(() => {
    let isMounted = true;

    const fetchFlashcardSet = async () => {
      try {
        const hasInitial = Boolean(initialSet);
        if (!hasInitial) {
          setIsLoading(true);
          setError(null);
        }

        const flashcardSet = initialSet ?? (await getFlashcardSet(setId));
        if (!isMounted) return;

        setSet(flashcardSet);
        setActiveCardIds(flashcardSet.cards.map((c) => c.id));
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setHasShuffled(false);
        addRecentSet(setId);

        // If signed in, hydrate (and optionally merge) cross-device progress from Firestore.
        if (userId) {
          try {
            const progress = await getFlashcardStudyProgress(userId, setId);
            if (!isMounted) return;

            const serverMastery = (progress?.masteryByCardId ??
              EMPTY_MASTERY) as Record<string, 0 | 1 | 2 | 3>;
            if (Object.keys(serverMastery).length > 0) {
              hydrateProgress(userId, setId, serverMastery);
            }

            // Merge any anonymous local progress into the signed-in profile (Quizlet-like continuity).
            const anonMastery =
              getProgress(ANON_USER_ID, setId)?.masteryByCardId ?? null;
            if (anonMastery && Object.keys(anonMastery).length > 0) {
              const merged = mergeMastery(serverMastery, anonMastery);
              if (!isSameMastery(serverMastery, merged)) {
                hydrateProgress(userId, setId, merged);
                saveFlashcardStudyProgress({
                  userId,
                  setId,
                  masteryByCardId: merged,
                }).catch(() => {
                  // Non-blocking: local state is still correct.
                });
              }
              resetProgress(ANON_USER_ID, setId);
            }
          } finally {
            hasHydratedFromServerRef.current = true;
          }
        }
      } catch (err) {
        if (!isMounted) return;
        const message = String(err instanceof Error ? err.message : err);
        const isPermissionDenied =
          message.toLowerCase().includes("permission") ||
          message.toLowerCase().includes("insufficient");

        setError(
          isPermissionDenied && !userId
            ? "This set is private. Sign in to access it."
            : "Failed to load flashcard set. Please try again."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchFlashcardSet();

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, [
    addRecentSet,
    getProgress,
    hydrateProgress,
    initialSet,
    resetProgress,
    setId,
    userId,
  ]);

  // Persist mastery to Firestore (debounced) once initial hydration is done.
  useEffect(() => {
    if (!userId) return;
    if (!hasHydratedFromServerRef.current) return;
    if (saveDebounceRef.current) {
      window.clearTimeout(saveDebounceRef.current);
    }

    saveDebounceRef.current = window.setTimeout(() => {
      saveFlashcardStudyProgress({
        userId,
        setId,
        masteryByCardId,
      }).catch(() => {
        // Non-blocking: local state still works even if save fails.
      });
    }, 750);

    return () => {
      if (saveDebounceRef.current) {
        window.clearTimeout(saveDebounceRef.current);
      }
    };
  }, [masteryByCardId, setId, userId]);

  // Keyboard shortcuts (Quizlet-like feel)
  useEffect(() => {
    if (studyMode !== "cards") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        nextCard();
      }
      if (e.key === "ArrowLeft") {
        prevCard();
      }
      if (e.key === " " || e.key === "Enter") {
        flipCard();
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flipCard, nextCard, prevCard, studyMode]);

  // Conditional rendering for different states
  if (isLoading) {
    return (
      <PageContainer>
        <LoadingState message="Loading flashcard set..." />
      </PageContainer>
    );
  }

  if (error || !set) {
    return (
      <PageContainer>
        <ErrorDisplay message={error || "Flashcard set not found."} />
        <ActionLink href={ROUTES.FLASHCARDS.INDEX} className="mt-4">
          Back to Flashcards
        </ActionLink>
      </PageContainer>
    );
  }

  if (set.cards.length === 0) {
    return (
      <PageContainer>
        <p className="text-muted-foreground">This flashcard set has no cards.</p>
        <ActionLink href={ROUTES.FLASHCARDS.INDEX} className="mt-4">
          Back to Flashcards
        </ActionLink>
      </PageContainer>
    );
  }

  const isOwner = Boolean(userId && userId === set.userId);

  return (
    <PageContainer>
      <div className="mb-6">
        <ActionLink href={ROUTES.FLASHCARDS.INDEX} variant="secondary">
          ← Back to Flashcards
        </ActionLink>
      </div>

      {!userId && (
        <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-4 mb-6">
          <div className="text-sm text-muted-foreground">
            You can study this set without signing in. Sign in to sync progress
            across devices.
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6 mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold truncate">{set.title}</h1>
            {set.description && (
              <p className="text-muted-foreground mt-1 whitespace-pre-wrap break-words">
                {set.description}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-3">
              {set.cards.length} terms
              {hasShuffled ? " • shuffled" : ""}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href);
                } catch {
                  // no-op
                }
              }}
              aria-label="Copy link to set"
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Share
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveCardIds((prev) => shuffle(prev));
                setCurrentCardIndex(0);
                setIsFlipped(false);
                setHasShuffled(true);
              }}
              aria-label="Shuffle cards"
            >
              <Shuffle className="h-4 w-4 mr-2" />
              Shuffle
            </Button>

            {userId && !isOwner && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const newSetId = await createFlashcardSet(
                      userId,
                      `${set.title} (copy)`,
                      set.description ?? "",
                      set.cards.map((c) => ({
                        term: c.term,
                        definition: c.definition,
                      })),
                      false
                    );
                    router.push(ROUTES.FLASHCARDS.SET(newSetId));
                  } catch {
                    // no-op (non-blocking UI); card-level duplication provides error feedback
                  }
                }}
              >
                Duplicate
              </Button>
            )}

            {isOwner && (
              <ActionLink href={ROUTES.FLASHCARDS.EDIT(set.id)} variant="primary">
                Edit
              </ActionLink>
            )}
          </div>
        </div>

        <div className="mt-5">
          <StudyModeTabs value={studyMode} onChange={setStudyMode} />
        </div>
      </div>

      {studyMode === "cards" && (
        <>
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="text-sm text-muted-foreground">
              Tip: use ← / → to navigate, Space to flip
            </div>
            {currentCard && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => toggleStar(set.id, currentCard.id)}
                aria-label={isStarred(set.id, currentCard.id) ? "Unstar term" : "Star term"}
                className={cn(
                  "px-2",
                  isStarred(set.id, currentCard.id) &&
                    "text-amber-500 hover:text-amber-600"
                )}
              >
                <Star className="h-4 w-4" />
              </Button>
            )}
          </div>

          <CardStudyMode
            currentCard={currentCard ? { term: currentCard.term, definition: currentCard.definition } : null}
            currentIndex={currentCardIndex}
            totalCards={activeCardIds.length}
            isFlipped={isFlipped}
            onFlip={flipCard}
            onPrev={prevCard}
            onNext={nextCard}
          />
        </>
      )}

      {studyMode === "learn" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm text-muted-foreground">
              Learn adapts based on what you miss most.
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => resetProgress(progressUserId, set.id)}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset progress
            </Button>
          </div>

          <LearnMode
            cards={set.cards}
            masteryByCardId={getProgress(progressUserId, set.id)?.masteryByCardId ?? {}}
            onSetMastery={(cardId, mastery) =>
              setMastery(progressUserId, set.id, cardId, mastery)
            }
          />
        </div>
      )}

      {studyMode === "test" && <TestMode cards={set.cards} />}

      <TermsList
        cards={set.cards}
        starredCardIds={
          new Set(
            set.cards
              .map((c) => c.id)
              .filter((id) => isStarred(set.id, id))
          )
        }
        onToggleStar={(cardId) => toggleStar(set.id, cardId)}
        onJumpToCard={(cardId) => {
          const idx = activeCardIds.indexOf(cardId);
          if (idx >= 0) {
            setStudyMode("cards");
            setCurrentCardIndex(idx);
            setIsFlipped(false);
          }
        }}
      />
    </PageContainer>
  );
}
