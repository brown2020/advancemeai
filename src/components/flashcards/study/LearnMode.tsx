"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import type { Flashcard } from "@/types/flashcard";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { buildMultipleChoiceOptions, clampMastery } from "./study-utils";
import { useGamification } from "@/hooks/useGamification";
import { StreakCounter, XPBadge } from "@/components/gamification";
import { Target, Zap, Trophy, Brain } from "lucide-react";

type Phase = "goal-selection" | "answering" | "feedback" | "complete";

interface LearnGoal {
  type: "all" | "count" | "time";
  value?: number; // card count or minutes
}

export function LearnMode({
  cards,
  masteryByCardId,
  onSetMastery,
}: {
  cards: Flashcard[];
  masteryByCardId: Record<string, 0 | 1 | 2 | 3>;
  onSetMastery: (cardId: string, mastery: 0 | 1 | 2 | 3) => void;
}) {
  const [_queue, setQueue] = useState<string[]>([]);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("goal-selection");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [lastWasCorrect, setLastWasCorrect] = useState<boolean | null>(null);
  const [goal, setGoal] = useState<LearnGoal>({ type: "all" });
  const [goalMasteredCount, setGoalMasteredCount] = useState(0);

  // Gamification
  const { xp, level, currentStreak, recordSessionComplete, awardXP } = useGamification();
  const sessionStats = useRef({ cardsStudied: 0, cardsMastered: 0, correctAnswers: 0 });
  const sessionStartTime = useRef<number>(0);
  // Store final stats for rendering (refs shouldn't be read during render)
  const [finalStats, setFinalStats] = useState({ cardsStudied: 0, cardsMastered: 0, correctAnswers: 0 });

  const cardById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  const learnedCount = useMemo(() => {
    return cards.reduce((sum, c) => sum + (masteryByCardId[c.id] === 3 ? 1 : 0), 0);
  }, [cards, masteryByCardId]);

  const progressPct = useMemo(() => {
    if (!cards.length) return 0;
    return Math.round((learnedCount / cards.length) * 100);
  }, [cards.length, learnedCount]);

  // Calculate unmastered cards count
  const unmasteredCount = useMemo(() => {
    return cards.filter((c) => (masteryByCardId[c.id] ?? 0) < 3).length;
  }, [cards, masteryByCardId]);

  // Start learning with selected goal
  const startLearning = useCallback((selectedGoal: LearnGoal) => {
    setGoal(selectedGoal);
    setGoalMasteredCount(0);
    sessionStats.current = { cardsStudied: 0, cardsMastered: 0, correctAnswers: 0 };
    sessionStartTime.current = Date.now();

    // Get unmastered cards, sorted by lowest mastery first
    let cardsToStudy = [...cards]
      .filter((c) => (masteryByCardId[c.id] ?? 0) < 3)
      .sort((a, b) => (masteryByCardId[a.id] ?? 0) - (masteryByCardId[b.id] ?? 0));

    // If goal is count-based, limit the cards
    if (selectedGoal.type === "count" && selectedGoal.value) {
      cardsToStudy = cardsToStudy.slice(0, selectedGoal.value);
    }

    const ordered = cardsToStudy.map((c) => c.id);
    setQueue(ordered);
    setActiveCardId(ordered[0] ?? null);
    setPhase(ordered.length ? "answering" : "complete");
    setSelectedCardId(null);
    setLastWasCorrect(null);
  }, [cards, masteryByCardId]);

  // Reset to goal selection when cards change
  useEffect(() => {
    setPhase("goal-selection");
    setQueue([]);
    setActiveCardId(null);
    setGoalMasteredCount(0);
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

    let newlyMastered = false;
    if (nextMastery === 3 && currentMastery < 3) {
      sessionStats.current.cardsMastered += 1;
      newlyMastered = true;
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

      // Check if goal is reached
      const updatedGoalMastered = goalMasteredCount + (newlyMastered ? 1 : 0);
      if (newlyMastered) {
        setGoalMasteredCount(updatedGoalMastered);
      }

      const goalReached = goal.type === "count" && goal.value && updatedGoalMastered >= goal.value;
      const nextId = goalReached ? null : (nextQueue[0] ?? null);
      setActiveCardId(nextId);

      // If completing, record session and save final stats for render
      if (!nextId) {
        const durationSeconds = Math.floor((Date.now() - sessionStartTime.current) / 1000);
        recordSessionComplete({
          cardsStudied: sessionStats.current.cardsStudied,
          cardsMastered: sessionStats.current.cardsMastered,
          isPerfectScore: sessionStats.current.correctAnswers === sessionStats.current.cardsStudied,
          durationSeconds,
        });
        // Save stats to state so we can read them during render
        setFinalStats({ ...sessionStats.current });
      }

      setPhase(nextId ? "answering" : "complete");
      setSelectedCardId(null);
      setLastWasCorrect(null);
      return nextQueue;
    });
  }

  if (!cards.length) return null;

  // Goal selection phase
  if (phase === "goal-selection") {
    const goalOptions = [
      {
        type: "all" as const,
        label: "Master all",
        description: `Study all ${unmasteredCount} unmastered terms`,
        icon: <Trophy className="h-5 w-5" />,
        disabled: unmasteredCount === 0,
      },
      {
        type: "count" as const,
        value: 5,
        label: "Quick session",
        description: "Master 5 terms",
        icon: <Zap className="h-5 w-5" />,
        disabled: unmasteredCount < 5,
      },
      {
        type: "count" as const,
        value: 10,
        label: "Standard session",
        description: "Master 10 terms",
        icon: <Target className="h-5 w-5" />,
        disabled: unmasteredCount < 10,
      },
      {
        type: "count" as const,
        value: 20,
        label: "Deep dive",
        description: "Master 20 terms",
        icon: <Brain className="h-5 w-5" />,
        disabled: unmasteredCount < 20,
      },
    ];

    return (
      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold mb-2">Set Your Learning Goal</h2>
          <p className="text-muted-foreground">
            {unmasteredCount > 0
              ? `You have ${unmasteredCount} terms left to master. How many would you like to study?`
              : "You've mastered all terms! Great job!"}
          </p>
        </div>

        {unmasteredCount === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🎉</div>
            <p className="text-lg font-medium text-emerald-600 dark:text-emerald-400">
              All terms mastered!
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Reset your progress to study again.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {goalOptions.map((option) => (
              <button
                key={`${option.type}-${option.value ?? "all"}`}
                type="button"
                disabled={option.disabled}
                onClick={() => startLearning({ type: option.type, value: option.value })}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-lg border text-left transition-all",
                  "hover:border-primary hover:bg-primary/5",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  option.disabled && "opacity-50 cursor-not-allowed hover:border-border hover:bg-transparent"
                )}
              >
                <div className="mt-0.5 text-primary">{option.icon}</div>
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {option.disabled && option.value
                      ? `Need at least ${option.value} unmastered terms`
                      : option.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Mastered: {learnedCount}/{cards.length}</span>
            <div className="flex items-center gap-3">
              <StreakCounter streak={currentStreak} size="sm" showLabel={false} />
              <XPBadge xp={xp} level={level} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "complete") {
    const stats = finalStats;
    const isPerfect = stats.correctAnswers === stats.cardsStudied && stats.cardsStudied > 0;
    const goalReached = goal.type === "count" && goal.value && goalMasteredCount >= goal.value;
    const remainingUnmastered = cards.filter((c) => (masteryByCardId[c.id] ?? 0) < 3).length;

    return (
      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {goalReached ? "Goal reached!" : "Session complete!"}
          </h2>
          <div className="flex items-center gap-3">
            <StreakCounter streak={currentStreak} size="sm" />
            <XPBadge xp={xp} level={level} />
          </div>
        </div>

        <div className="space-y-4">
          {goal.type === "count" && goal.value && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">
                  {goalMasteredCount >= goal.value
                    ? `Goal completed: ${goal.value} terms mastered!`
                    : `Progress: ${goalMasteredCount}/${goal.value} terms mastered`}
                </div>
              </div>
            </div>
          )}

          <p className="text-muted-foreground">
            You&apos;ve mastered {learnedCount} of {cards.length} terms total.
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

          {remainingUnmastered > 0 && (
            <div className="pt-4 border-t border-border">
              <Button
                type="button"
                onClick={() => setPhase("goal-selection")}
                className="w-full"
              >
                Study More ({remainingUnmastered} terms remaining)
              </Button>
            </div>
          )}
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
              {goal.type === "count" && goal.value ? (
                <>Goal: {goalMasteredCount}/{goal.value} • Overall: {learnedCount}/{cards.length} mastered</>
              ) : (
                <>Progress: {progressPct}% • Mastered {learnedCount}/{cards.length}</>
              )}
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
              style={{
                width: goal.type === "count" && goal.value
                  ? `${Math.min(100, (goalMasteredCount / goal.value) * 100)}%`
                  : `${progressPct}%`
              }}
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


