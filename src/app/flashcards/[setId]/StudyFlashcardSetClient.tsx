"use client";

import { useAuth } from "@/lib/auth";
import { useEffect, useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FlashcardSet, StudyMode } from "@/types/flashcard";
import {
  createFlashcardSet,
  getFlashcardSet,
} from "@/services/flashcardService";
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
import {
  Star,
  Shuffle,
  RotateCcw,
  Play,
  Pause,
  Edit3,
  Copy,
  ArrowLeft,
  BookOpen,
  User,
} from "lucide-react";
import { StudyModeTabs } from "@/components/flashcards/study/StudyModeTabs";
import { StudyModeGrid } from "@/components/flashcards/study/StudyModeGrid";
import { ProgressBar } from "@/components/flashcards/study/ProgressRing";
import {
  FlashcardSettings,
  DEFAULT_SETTINGS,
  type FlashcardStudySettings,
} from "@/components/flashcards/study/FlashcardSettings";
import { TermsList } from "@/components/flashcards/study/TermsList";
import { LearnMode } from "@/components/flashcards/study/LearnMode";
import { TestMode } from "@/components/flashcards/study/TestMode";
import { WriteMode } from "@/components/flashcards/study/WriteMode";
import { MatchMode } from "@/components/flashcards/study/MatchMode";
import { ShareModal } from "@/components/sharing/ShareModal";
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
    merged[cardId] = Math.max(current, mastery) as 0 | 1 | 2 | 3;
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
  const [flashcardSettings, setFlashcardSettings] =
    useState<FlashcardStudySettings>(DEFAULT_SETTINGS);
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);

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
    return (
      s.progressByUserSetKey[progressKey]?.masteryByCardId ?? EMPTY_MASTERY
    );
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

  // Autoplay effect
  useEffect(() => {
    if (
      studyMode !== "cards" ||
      !flashcardSettings.autoplay ||
      isAutoplayPaused ||
      currentCardIndex >= activeCardIds.length - 1
    ) {
      return;
    }

    const timer = setTimeout(() => {
      if (!isFlipped) {
        setIsFlipped(true);
      } else {
        nextCard();
      }
    }, flashcardSettings.autoplaySpeed * 1000);

    return () => clearTimeout(timer);
  }, [
    studyMode,
    flashcardSettings.autoplay,
    flashcardSettings.autoplaySpeed,
    isAutoplayPaused,
    isFlipped,
    currentCardIndex,
    activeCardIds.length,
    nextCard,
  ]);

  // Effect to apply shuffle setting when it changes
  useEffect(() => {
    if (!set) return;

    if (flashcardSettings.shuffle && !hasShuffled) {
      // Shuffle the cards when the setting is turned on
      setActiveCardIds((prev) => shuffle(prev));
      setHasShuffled(true);
      setCurrentCardIndex(0);
    } else if (!flashcardSettings.shuffle && hasShuffled) {
      // Restore original order when shuffle is turned off
      setActiveCardIds(set.cards.map((c) => c.id));
      setHasShuffled(false);
      setCurrentCardIndex(0);
    }
  }, [flashcardSettings.shuffle, hasShuffled, set]);

  // Filter cards based on settings (starred only)
  const filteredCardIds = useMemo(() => {
    if (!flashcardSettings.starredOnly) return activeCardIds;
    return activeCardIds.filter((id) => isStarred(set?.id ?? "", id));
  }, [activeCardIds, flashcardSettings.starredOnly, isStarred, set?.id]);

  // Count starred cards
  const starredCount = useMemo(() => {
    if (!set) return 0;
    return set.cards.filter((c) => isStarred(set.id, c.id)).length;
  }, [set, isStarred]);

  // Calculate mastery progress (must be before early returns)
  const masteredCount = useMemo(() => {
    return Object.values(masteryByCardId).filter((m) => m >= 3).length;
  }, [masteryByCardId]);

  const progressPercent = useMemo(() => {
    if (!set || set.cards.length === 0) return 0;
    return Math.round((masteredCount / set.cards.length) * 100);
  }, [masteredCount, set]);

  // Show overview when no study mode is selected (initial state)
  const [showOverview, setShowOverview] = useState(true);

  // Restart flashcards handler
  const handleRestartFlashcards = useCallback(() => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setHasShuffled(false);
    if (set) {
      setActiveCardIds(set.cards.map((c) => c.id));
    }
  }, [set]);

  const handleSelectMode = useCallback((mode: StudyMode) => {
    setStudyMode(mode);
    setShowOverview(false);
  }, []);

  const handleBackToOverview = useCallback(() => {
    setShowOverview(true);
  }, []);

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
        <p className="text-muted-foreground">
          This flashcard set has no cards.
        </p>
        <ActionLink href={ROUTES.FLASHCARDS.INDEX} className="mt-4">
          Back to Flashcards
        </ActionLink>
      </PageContainer>
    );
  }

  const isOwner = Boolean(userId && userId === set.userId);

  return (
    <PageContainer>
      {/* Back navigation */}
      <div className="mb-4">
        {showOverview ? (
          <ActionLink href={ROUTES.FLASHCARDS.INDEX} variant="secondary">
            <ArrowLeft className="h-4 w-4 mr-1 inline" />
            Back to Flashcards
          </ActionLink>
        ) : (
          <button
            onClick={handleBackToOverview}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to set
          </button>
        )}
      </div>

      {/* Sign-in prompt for anonymous users */}
      {!userId && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 mb-4 text-sm text-muted-foreground">
          Sign in to sync your progress across devices and track your learning.
        </div>
      )}

      {/* Set header - always visible */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold">{set.title}</h1>
            {set.description && (
              <p className="text-muted-foreground mt-2 whitespace-pre-wrap break-words line-clamp-2">
                {set.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {set.cards.length} terms
              </span>
              {set.userId && (
                <span className="inline-flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Created by you
                </span>
              )}
              {hasShuffled && <span className="text-primary">Shuffled</span>}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <ShareModal title={set.title} url={`/flashcards/${set.id}`} />

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
                    // no-op
                  }
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            )}

            {isOwner && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.push(ROUTES.FLASHCARDS.EDIT(set.id))}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Overview / Study mode selection */}
      {showOverview && (
        <div className="space-y-6">
          {/* Progress card */}
          {masteredCount > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Your Progress</h3>
                <span className="text-sm text-muted-foreground">
                  {masteredCount} of {set.cards.length} mastered
                </span>
              </div>
              <ProgressBar
                progress={progressPercent}
                showLabel={false}
                size="md"
              />
            </div>
          )}

          {/* Study modes grid */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Study</h2>
            <StudyModeGrid onSelectMode={handleSelectMode} />
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveCardIds((prev) => shuffle(prev));
                setCurrentCardIndex(0);
                setIsFlipped(false);
                setHasShuffled(true);
                handleSelectMode("cards");
              }}
            >
              <Shuffle className="h-4 w-4 mr-2" />
              Shuffle & Study
            </Button>

            {masteredCount > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  resetProgress(progressUserId, set.id);
                }}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Progress
              </Button>
            )}
          </div>

          {/* Terms preview */}
          <TermsList
            cards={set.cards}
            starredCardIds={
              new Set(
                set.cards.map((c) => c.id).filter((id) => isStarred(set.id, id))
              )
            }
            onToggleStar={(cardId) => toggleStar(set.id, cardId)}
            onJumpToCard={(cardId) => {
              const idx = activeCardIds.indexOf(cardId);
              if (idx >= 0) {
                handleSelectMode("cards");
                setCurrentCardIndex(idx);
                setIsFlipped(false);
              }
            }}
          />
        </div>
      )}

      {/* Active study mode */}
      {!showOverview && (
        <div className="space-y-4">
          {/* Mode tabs for switching between modes while studying */}
          <div className="rounded-xl border border-border bg-card p-4">
            <StudyModeTabs value={studyMode} onChange={handleSelectMode} />
          </div>

          {studyMode === "cards" && (
            <>
              <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                <div className="text-sm text-muted-foreground">
                  Tip: use ← / → to navigate, Space to flip
                </div>
                <div className="flex items-center gap-2">
                  {flashcardSettings.autoplay && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAutoplayPaused((p) => !p)}
                      aria-label={
                        isAutoplayPaused ? "Resume autoplay" : "Pause autoplay"
                      }
                    >
                      {isAutoplayPaused ? (
                        <Play className="h-4 w-4" />
                      ) : (
                        <Pause className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  {currentCard && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStar(set.id, currentCard.id)}
                      aria-label={
                        isStarred(set.id, currentCard.id)
                          ? "Unstar term"
                          : "Star term"
                      }
                      className={cn(
                        "px-2",
                        isStarred(set.id, currentCard.id) &&
                          "text-amber-500 hover:text-amber-600"
                      )}
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <FlashcardSettings
                    settings={flashcardSettings}
                    onChange={setFlashcardSettings}
                    onRestart={handleRestartFlashcards}
                    hasStarredCards={starredCount > 0}
                  />
                </div>
              </div>

              {flashcardSettings.starredOnly &&
                filteredCardIds.length === 0 && (
                  <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6 text-center">
                    <p className="text-muted-foreground mb-3">
                      No starred terms to study.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setFlashcardSettings({
                          ...flashcardSettings,
                          starredOnly: false,
                        })
                      }
                    >
                      Show all terms
                    </Button>
                  </div>
                )}

              {(!flashcardSettings.starredOnly ||
                filteredCardIds.length > 0) && (
                <CardStudyMode
                  currentCard={
                    currentCard
                      ? {
                          term: flashcardSettings.showDefinitionFirst
                            ? currentCard.definition
                            : currentCard.term,
                          definition: flashcardSettings.showDefinitionFirst
                            ? currentCard.term
                            : currentCard.definition,
                        }
                      : null
                  }
                  currentIndex={currentCardIndex}
                  totalCards={
                    flashcardSettings.starredOnly
                      ? filteredCardIds.length
                      : activeCardIds.length
                  }
                  isFlipped={isFlipped}
                  onFlip={flipCard}
                  onPrev={prevCard}
                  onNext={nextCard}
                />
              )}
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
                masteryByCardId={
                  getProgress(progressUserId, set.id)?.masteryByCardId ?? {}
                }
                onSetMastery={(cardId, mastery) =>
                  setMastery(progressUserId, set.id, cardId, mastery)
                }
              />
            </div>
          )}

          {studyMode === "test" && <TestMode cards={set.cards} />}

          {studyMode === "write" && <WriteMode cards={set.cards} />}

          {studyMode === "match" && <MatchMode cards={set.cards} />}
        </div>
      )}
    </PageContainer>
  );
}
