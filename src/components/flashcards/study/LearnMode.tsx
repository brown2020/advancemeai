"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import type { Flashcard } from "@/types/flashcard";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { buildMultipleChoiceOptions, clampMastery } from "./study-utils";
import { useGamification } from "@/hooks/useGamification";
import { StreakCounter, XPBadge } from "@/components/gamification";

type Phase = "answering" | "feedback" | "complete";

export function LearnMode({
  cards,
  masteryByCardId,
  onSetMastery,
}: {
  cards: Flashcard[];
  masteryByCardId: Record<string, 0 | 1 | 2 | 3>;
  onSetMastery: (cardId: string, mastery: 0 | 1 | 2 | 3) => void;
}) {
  const [queue, setQueue] = useState<string[]>([]);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("answering");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [lastWasCorrect, setLastWasCorrect] = useState<boolean | null>(null);

  // Gamification
  const { xp, level, currentStreak, recordSessionComplete, awardXP } = useGamification();
  const sessionStats = useRef({ cardsStudied: 0, cardsMastered: 0, correctAnswers: 0 });
  const sessionStartTime = useRef<number>(0);

  const cardById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  const learnedCount = useMemo(() => {
    return cards.reduce((sum, c) => sum + (masteryByCardId[c.id] === 3 ? 1 : 0), 0);
  }, [cards, masteryByCardId]);

  const progressPct = useMemo(() => {
    if (!cards.length) return 0;
    return Math.round((learnedCount / cards.length) * 100);
  }, [cards.length, learnedCount]);

  // Initialize queue with weakest cards first
  useEffect(() => {
    const ordered = [...cards]
      .sort((a, b) => (masteryByCardId[a.id] ?? 0) - (masteryByCardId[b.id] ?? 0))
      .map((c) => c.id);
    setQueue(ordered);
    setActiveCardId(ordered[0] ?? null);
    setPhase(ordered.length ? "answering" : "complete");
    setSelectedCardId(null);
    setLastWasCorrect(null);
    // We intentionally do NOT re-init on mastery changes; otherwise every answer resets the session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards]);

  const activeCard = activeCardId ? cardById.get(activeCardId) ?? null : null;

  const options = useMemo(() => {
    if (!activeCard) return null;
    const { optionCardIds, correctIndex } = buildMultipleChoiceOptions(
      cards,
      activeCard.id,
      4
    );
    return {
      optionCardIds,
      correctIndex,
      options: optionCardIds.map((id) => cardById.get(id)!).filter(Boolean),
    };
  }, [activeCard, cardById, cards]);

  function advanceQueue({ wasCorrect }: { wasCorrect: boolean }) {
    if (!activeCard) return;

    const currentMastery = masteryByCardId[activeCard.id] ?? 0;
    const nextMastery = clampMastery(currentMastery + (wasCorrect ? 1 : -1));
    onSetMastery(activeCard.id, nextMastery);

    // Track gamification stats
    sessionStats.current.cardsStudied += 1;
    if (wasCorrect) {
      sessionStats.current.correctAnswers += 1;
      awardXP("card-studied");
    }
    if (nextMastery === 3 && currentMastery < 3) {
      sessionStats.current.cardsMastered += 1;
      awardXP("card-mastered");
    }

    setQueue((prev) => {
      const rest = prev.filter((id) => id !== activeCard.id);
      // If mastered, remove from rotation; else push back (incorrect comes back sooner)
      const nextQueue =
        nextMastery === 3
          ? rest
          : wasCorrect
            ? [...rest, activeCard.id]
            : [...rest.slice(0, 2), activeCard.id, ...rest.slice(2)];

      const nextId = nextQueue[0] ?? null;
      setActiveCardId(nextId);

      // If completing, record session
      if (!nextId) {
        const durationSeconds = Math.floor((Date.now() - sessionStartTime.current) / 1000);
        recordSessionComplete({
          cardsStudied: sessionStats.current.cardsStudied,
          cardsMastered: sessionStats.current.cardsMastered,
          isPerfectScore: sessionStats.current.correctAnswers === sessionStats.current.cardsStudied,
          durationSeconds,
        });
      }

      setPhase(nextId ? "answering" : "complete");
      setSelectedCardId(null);
      setLastWasCorrect(null);
      return nextQueue;
    });
  }

  if (!cards.length) return null;

  if (phase === "complete") {
    const stats = sessionStats.current;
    const isPerfect = stats.correctAnswers === stats.cardsStudied && stats.cardsStudied > 0;

    return (
      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Learn complete!</h2>
          <div className="flex items-center gap-3">
            <StreakCounter streak={currentStreak} size="sm" />
            <XPBadge xp={xp} level={level} />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-muted-foreground">
            You&apos;ve mastered {learnedCount} of {cards.length} terms.
          </p>

          {isPerfect && (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <span className="text-2xl">🎉</span>
              <span className="font-medium">Perfect score! +50 XP bonus</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-primary">{stats.cardsStudied}</div>
              <div className="text-xs text-muted-foreground">Cards Studied</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold text-emerald-600">{stats.cardsMastered}</div>
              <div className="text-xs text-muted-foreground">Newly Mastered</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!activeCard || !options) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <div className="text-xs text-muted-foreground">LEARN</div>
            <div className="text-sm text-muted-foreground">
              Progress: {progressPct}% • Mastered {learnedCount}/{cards.length}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StreakCounter streak={currentStreak} size="sm" showLabel={false} />
            <XPBadge xp={xp} level={level} />
          </div>
        </div>
        <div className="w-full mb-4">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progressPct}%` }}
              aria-hidden
            />
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">What matches this term?</h3>
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="text-xl font-semibold whitespace-pre-wrap break-words">
              {activeCard.term}
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          {options.optionCardIds.map((optId) => {
            const opt = cardById.get(optId);
            if (!opt) return null;
            const isSelected = selectedCardId === opt.id;
            const isCorrect = opt.id === activeCard.id;
            const showFeedback = phase === "feedback";
            const stateClass = showFeedback
              ? isCorrect
                ? "border-emerald-500"
                : isSelected
                  ? "border-destructive"
                  : "border-border"
              : "border-border";

            return (
              <button
                key={opt.id}
                type="button"
                className={cn(
                  "text-left rounded-xl border bg-card p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  "hover:bg-accent hover:text-accent-foreground",
                  stateClass,
                  phase !== "answering" && "cursor-default hover:bg-card hover:text-card-foreground"
                )}
                disabled={phase !== "answering"}
                onClick={() => {
                  setSelectedCardId(opt.id);
                  const wasCorrect = opt.id === activeCard.id;
                  setLastWasCorrect(wasCorrect);
                  setPhase("feedback");
                }}
              >
                <div className="whitespace-pre-wrap break-words">{opt.definition}</div>
              </button>
            );
          })}
        </div>

        {phase === "feedback" && (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div
              className={cn(
                "text-sm font-medium",
                lastWasCorrect ? "text-emerald-600" : "text-destructive"
              )}
            >
              {lastWasCorrect ? "Correct" : "Not quite — you’ll see this again soon."}
            </div>
            <Button
              type="button"
              onClick={() => advanceQueue({ wasCorrect: Boolean(lastWasCorrect) })}
            >
              Continue
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}


