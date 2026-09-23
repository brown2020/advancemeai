"use client";

import { useAuth } from "@/lib/auth";
import { useEffect, useCallback, useMemo, useRef, useState, useReducer} from "react";
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
import { Star, RotateCcw, Play, Pause, ArrowLeft } from "lucide-react";
import { StudyModeTabs } from "@/components/flashcards/study/StudyModeTabs";
import { SetLandingOverview } from "@/components/flashcards/SetLandingOverview";
import {
  FlashcardSettings,
  DEFAULT_SETTINGS,
  type FlashcardStudySettings,
} from "@/components/flashcards/study/FlashcardSettings";
import { LearnMode } from "@/components/flashcards/study/LearnMode";
import { TestMode } from "@/components/flashcards/study/TestMode";
import { WriteMode } from "@/components/flashcards/study/WriteMode";
import { MatchMode } from "@/components/flashcards/study/MatchMode";
import { ShareModal } from "@/components/sharing/ShareModal";
import { canCopyFlashcardSet } from "@/lib/flashcard-visibility";
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
    <Button onClick={onNext} disabled={isLast} variant="default">
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

function useStudyFlashcardSetClientModel({

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
  const progressKey = `${progressUserId}:${setId}`;

  const [state, dispatch] = useReducer(
    (s: any, p: Record<string, any>): any => {
      const patch: Record<string, any> = {};
      for (const key of Object.keys(p)) {
        const value = p[key];
        patch[key] = typeof value === "function" ? value(s[key]) : value;
      }
      return { ...s, ...patch };
    },
    {
    set: null,
    activeCardIds: [],
    currentCardIndex: 0,
    isFlipped: false,
    isLoading: true,
    error: null,
    studyMode: "cards",
    hasShuffled: false,
    }
  );
  const { set, activeCardIds, currentCardIndex, isFlipped, isLoading, error, studyMode, hasShuffled } = state as any;
  const assignSet = (value: any) => dispatch({ set: value });
  const assignActiveCardIds = (value: any) => dispatch({ activeCardIds: value });
  const assignCurrentCardIndex = (value: any) => dispatch({ currentCardIndex: value });
  const assignIsFlipped = (value: any) => dispatch({ isFlipped: value });
  const assignIsLoading = (value: any) => dispatch({ isLoading: value });
  const assignError = (value: any) => dispatch({ error: value });
  const assignStudyMode = (value: any) => dispatch({ studyMode: value });
  const assignHasShuffled = (value: any) => dispatch({ hasShuffled: value });

  const [flashcardSettings, assignFlashcardSettings] = useState<FlashcardStudySettings>(DEFAULT_SETTINGS);
  const [isAutoplayPaused, assignIsAutoplayPaused] = useState(false);

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
      assignCurrentCardIndex(currentCardIndex + 1);
      assignIsFlipped(false);
    }
  }, [activeCardIds.length, currentCardIndex]);

  const prevCard = useCallback(() => {
    if (currentCardIndex > 0) {
      assignCurrentCardIndex(currentCardIndex - 1);
      assignIsFlipped(false);
    }
  }, [currentCardIndex]);

  const flipCard = useCallback(() => {
    assignIsFlipped(!isFlipped);
  }, [isFlipped]);

  const cardById = useMemo(() => {
    return new Map((set?.cards ?? []).map((c) => [c.id, c]));
  }, [set?.cards]);

  // Get current card
  const currentCard: any = useMemo(() => {
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
          assignIsLoading(true);
          assignError(null);
        }

        const flashcardSet = initialSet ?? (await getFlashcardSet(setId));
        if (!isMounted) return;

        assignSet(flashcardSet);
        assignActiveCardIds(flashcardSet.cards.map((c) => c.id));
        assignCurrentCardIndex(0);
        assignIsFlipped(false);
        assignHasShuffled(false);
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

        assignError(
          isPermissionDenied && !userId
            ? "This set is private. Sign in to access it."
            : "Failed to load flashcard set. Please try again."
        );
      } finally {
        if (isMounted) {
          assignIsLoading(false);
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
        assignIsFlipped(true);
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
      assignActiveCardIds((prev) => shuffle(prev));
      assignHasShuffled(true);
      assignCurrentCardIndex(0);
    } else if (!flashcardSettings.shuffle && hasShuffled) {
      // Restore original order when shuffle is turned off
      assignActiveCardIds(set.cards.map((c) => c.id));
      assignHasShuffled(false);
      assignCurrentCardIndex(0);
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
  const masteredCount = Object.values(masteryByCardId).filter((m) => m >= 3).length;

  const progressPercent = useMemo(() => {
    if (!set || set.cards.length === 0) return 0;
    return Math.round((masteredCount / set.cards.length) * 100);
  }, [masteredCount, set]);

  // Show overview when no study mode is selected (initial state)
  const [showOverview, assignShowOverview] = useState(true);
  const [isCopying, assignIsCopying] = useState(false);

  // Restart flashcards handler
  const handleRestartFlashcards = useCallback(() => {
    assignCurrentCardIndex(0);
    assignIsFlipped(false);
    assignHasShuffled(false);
    if (set) {
      assignActiveCardIds(set.cards.map((c) => c.id));
    }
  }, [set]);

  const handleSelectMode = useCallback((mode: StudyMode) => {
    assignStudyMode(mode);
    assignShowOverview(false);
  }, []);

  const handleBackToOverview = useCallback(() => {
    assignShowOverview(true);
  }, []);

  useEffect(() => {
    if (!showOverview || !setId) return;

    let cancelled = false;
    void getFlashcardSet(setId)
      .then((fresh) => {
        if (!cancelled) assignSet(fresh);
      })
      .catch(() => {
        // Keep existing set data if refresh fails.
      });

    return () => {
      cancelled = true;
    };
  }, [showOverview, setId]);

  const handleCopySet = useCallback(async () => {
    if (!userId || !set) return;
    assignIsCopying(true);
    try {
      const newSetId = await createFlashcardSet(
        userId,
        `${set.title} (copy)`,
        set.description ?? "",
        set.cards.map((c) => ({
          term: c.term,
          definition: c.definition,
        })),
        "private"
      );
      router.push(ROUTES.FLASHCARDS.SET(newSetId));
    } catch {
      // no-op
    } finally {
      assignIsCopying(false);
    }
  }, [router, set, userId]);

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
  const canCopy =
    Boolean(userId && set && canCopyFlashcardSet(set, userId)) && !isOwner;

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
            {hasShuffled && !showOverview ? (
              <p className="text-sm text-primary mt-2">Shuffled</p>
            ) : null}
          </div>

          {!showOverview ? (
            <div className="shrink-0">
              <ShareModal title={set.title} url={`/flashcards/${set.id}`} />
            </div>
          ) : null}
        </div>
      </div>

      {showOverview ? (
        <SetLandingOverview
          set={set}
          isOwner={isOwner}
          canCopy={canCopy}
          userId={userId}
          masteredCount={masteredCount}
          progressPercent={progressPercent}
          starredCardIds={
            new Set(
              set.cards.map((c) => c.id).filter((id) => isStarred(set.id, id))
            )
          }
          activeCardIds={activeCardIds}
          onSelectMode={handleSelectMode}
          onToggleStar={(cardId) => toggleStar(set.id, cardId)}
          onJumpToCard={(cardId) => {
            const idx = activeCardIds.indexOf(cardId);
            if (idx >= 0) {
              handleSelectMode("cards");
              assignCurrentCardIndex(idx);
              assignIsFlipped(false);
            }
          }}
          onShuffleAndStudy={() => {
            assignActiveCardIds((prev) => shuffle(prev));
            assignCurrentCardIndex(0);
            assignIsFlipped(false);
            assignHasShuffled(true);
            handleSelectMode("cards");
          }}
          onResetProgress={() => resetProgress(progressUserId, set.id)}
          onCopySet={() => void handleCopySet()}
          isCopying={isCopying}
        />
      ) : null}

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
                      onClick={() => assignIsAutoplayPaused((p) => !p)}
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
                    onChange={assignFlashcardSettings}
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
                        assignFlashcardSettings({
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
                key={set.cards.map((c) => c.id).join("|")}
                cards={set.cards}
                flashcardSetId={set.id}
                masteryByCardId={
                  getProgress(progressUserId, set.id)?.masteryByCardId ?? {}
                }
                onSetMastery={(cardId, mastery) =>
                  setMastery(progressUserId, set.id, cardId, mastery)
                }
              />
            </div>
          )}

          {studyMode === "test" && (
            <TestMode cards={set.cards} flashcardSetId={set.id} />
          )}

          {studyMode === "write" && (
            <WriteMode cards={set.cards} flashcardSetId={set.id} />
          )}

          {studyMode === "match" && (
            <MatchMode cards={set.cards} flashcardSetId={set.id} />
          )}
        </div>
      )}
    </PageContainer>
  );
}

export default function StudyFlashcardSetClient(...args: Parameters<typeof useStudyFlashcardSetClientModel>) {
  return useStudyFlashcardSetClientModel(...args);
}

