"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, PartyPopper, Target, Trophy } from "lucide-react";
import type { Flashcard } from "@/types/flashcard";
import { Button } from "@/components/ui/button";
import { useGamification } from "@/hooks/useGamification";
import {
  buildMultipleChoiceOptions,
  clampMastery,
  formatDuration,
  percent,
  secondsSince,
  type MasteryLevel,
  type MasteryMap,
} from "./study-utils";
import { AnswerOption, type AnswerOptionState } from "./AnswerOption";
import { LearnGoalPicker, type LearnGoal } from "./LearnGoalPicker";
import { StudyFeedback } from "./StudyFeedback";
import { StudyPromptCard } from "./StudyPromptCard";
import { StudyResults } from "./StudyResults";
import { StudyTopBar } from "./StudyTopBar";
import { useChoiceShortcuts } from "./useChoiceShortcuts";

type Phase = "goal-selection" | "answering" | "feedback" | "complete";

type SessionStats = {
  cardsStudied: number;
  cardsMastered: number;
  correctAnswers: number;
  durationSeconds: number;
};

const EMPTY_STATS: SessionStats = {
  cardsStudied: 0,
  cardsMastered: 0,
  correctAnswers: 0,
  durationSeconds: 0,
};

type LearnModeProps = {
  cards: Flashcard[];
  masteryByCardId: MasteryMap;
  onSetMastery: (cardId: string, mastery: MasteryLevel) => void;
  onResetProgress?: () => void;
  flashcardSetId?: string;
};

export function LearnMode({
  cards,
  masteryByCardId,
  onSetMastery,
  onResetProgress,
  flashcardSetId,
}: LearnModeProps) {
  const [phase, setPhase] = useState<Phase>("goal-selection");
  const [queue, setQueue] = useState<string[]>([]);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [goal, setGoal] = useState<LearnGoal>({ type: "all" });
  const [goalMasteredCount, setGoalMasteredCount] = useState(0);
  const [finalStats, setFinalStats] = useState<SessionStats>(EMPTY_STATS);

  const { xp, level, currentStreak, recordSessionComplete, awardXP } =
    useGamification();
  const sessionStats = useRef({ cardsStudied: 0, cardsMastered: 0, correctAnswers: 0 });
  const sessionStartTime = useRef(0);
  const continueRef = useRef<HTMLButtonElement>(null);

  const cardById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  const learnedCount = useMemo(
    () => cards.reduce((sum, c) => sum + (masteryByCardId[c.id] === 3 ? 1 : 0), 0),
    [cards, masteryByCardId]
  );
  const unmasteredCount = cards.filter((c) => (masteryByCardId[c.id] ?? 0) < 3).length;

  const activeCard = activeCardId ? cardById.get(activeCardId) ?? null : null;

  const optionCards = useMemo(() => {
    if (!activeCard) return [];
    const { optionCardIds } = buildMultipleChoiceOptions(cards, activeCard.id, 4);
    return optionCardIds
      .map((id) => cardById.get(id))
      .filter((c): c is Flashcard => Boolean(c));
  }, [activeCard, cardById, cards]);

  const rewards = { xp, level, streak: currentStreak };

  const startLearning = (selectedGoal: LearnGoal) => {
    setGoal(selectedGoal);
    setGoalMasteredCount(0);
    sessionStats.current = { cardsStudied: 0, cardsMastered: 0, correctAnswers: 0 };
    sessionStartTime.current = Date.now();

    // Unmastered cards, lowest mastery first.
    let cardsToStudy = [...cards]
      .filter((c) => (masteryByCardId[c.id] ?? 0) < 3)
      .sort((a, b) => (masteryByCardId[a.id] ?? 0) - (masteryByCardId[b.id] ?? 0));

    if (selectedGoal.type === "count") {
      cardsToStudy = cardsToStudy.slice(0, selectedGoal.value);
    }

    const ordered = cardsToStudy.map((c) => c.id);
    setQueue(ordered);
    setActiveCardId(ordered[0] ?? null);
    setPhase(ordered.length ? "answering" : "complete");
    setSelectedCardId(null);
  };

  const selectAnswer = (cardId: string) => {
    if (phase !== "answering") return;
    setSelectedCardId(cardId);
    setPhase("feedback");
  };

  const advanceQueue = () => {
    if (!activeCard) return;
    const wasCorrect = selectedCardId === activeCard.id;

    const currentMastery = masteryByCardId[activeCard.id] ?? 0;
    const nextMastery = clampMastery(currentMastery + (wasCorrect ? 1 : -1));
    onSetMastery(activeCard.id, nextMastery);

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

    // Mastered cards leave the rotation; misses come back sooner.
    const rest = queue.filter((id) => id !== activeCard.id);
    const nextQueue =
      nextMastery === 3
        ? rest
        : wasCorrect
          ? [...rest, activeCard.id]
          : [...rest.slice(0, 2), activeCard.id, ...rest.slice(2)];

    const updatedGoalMastered = goalMasteredCount + (newlyMastered ? 1 : 0);
    if (newlyMastered) setGoalMasteredCount(updatedGoalMastered);

    const goalReached = goal.type === "count" && updatedGoalMastered >= goal.value;
    const nextId = goalReached ? null : (nextQueue[0] ?? null);

    setQueue(nextQueue);
    setActiveCardId(nextId);

    if (!nextId) {
      const durationSeconds = secondsSince(sessionStartTime.current);
      void recordSessionComplete({
        cardsStudied: sessionStats.current.cardsStudied,
        cardsMastered: sessionStats.current.cardsMastered,
        isPerfectScore:
          sessionStats.current.correctAnswers === sessionStats.current.cardsStudied,
        durationSeconds,
        flashcardSetId,
      });
      setFinalStats({ ...sessionStats.current, durationSeconds });
    }

    setPhase(nextId ? "answering" : "complete");
    setSelectedCardId(null);
  };

  useChoiceShortcuts(phase === "answering", optionCards.length, (index) => {
    const card = optionCards[index];
    if (card) selectAnswer(card.id);
  });

  // Move focus to "Continue" so Enter advances after answering.
  useEffect(() => {
    if (phase === "feedback") continueRef.current?.focus();
  }, [phase]);

  if (!cards.length) return null;

  const isCountGoal = goal.type === "count";
  const topBarProgress = isCountGoal
    ? Math.min(100, percent(goalMasteredCount, goal.value))
    : percent(learnedCount, cards.length);
  const topBarLabel = isCountGoal
    ? `${goalMasteredCount} / ${goal.value}`
    : `${learnedCount} / ${cards.length}`;

  if (phase === "goal-selection") {
    return (
      <div className="space-y-4">
        <StudyTopBar
          progress={percent(learnedCount, cards.length)}
          progressLabel={`${learnedCount} / ${cards.length}`}
        />
        <LearnGoalPicker
          unmasteredCount={unmasteredCount}
          learnedCount={learnedCount}
          totalCount={cards.length}
          rewards={rewards}
          onStart={startLearning}
          onResetProgress={onResetProgress}
        />
      </div>
    );
  }

  if (phase === "complete") {
    const stats = finalStats;
    const isPerfect = stats.correctAnswers === stats.cardsStudied && stats.cardsStudied > 0;
    const goalReached = isCountGoal && goalMasteredCount >= goal.value;

    return (
      <div className="space-y-4">
        <StudyTopBar progress={topBarProgress} progressLabel={topBarLabel} />
        <StudyResults
          icon={goalReached ? Target : Trophy}
          title={goalReached ? "Goal reached!" : "Session complete!"}
          message={`You've mastered ${learnedCount} of ${cards.length} terms in this set.`}
          stats={[
            { label: "Studied", value: stats.cardsStudied, tone: "primary" },
            { label: "Newly mastered", value: stats.cardsMastered, tone: "success" },
            {
              label: "Accuracy",
              value: `${percent(stats.correctAnswers, stats.cardsStudied)}%`,
            },
            { label: "Time", value: formatDuration(stats.durationSeconds) },
          ]}
          highlight={
            isPerfect ? (
              <>
                <PartyPopper className="size-4" aria-hidden />
                Perfect score! +50 XP bonus
              </>
            ) : isCountGoal && !goalReached ? (
              `Progress: ${goalMasteredCount}/${goal.value} terms mastered`
            ) : undefined
          }
          rewards={rewards}
          againLabel={
            unmasteredCount > 0 ? `Keep learning (${unmasteredCount} left)` : "Study again"
          }
          onStudyAgain={() => setPhase("goal-selection")}
        />
      </div>
    );
  }

  if (!activeCard) return null;

  const showFeedback = phase === "feedback";
  const wasCorrect = selectedCardId === activeCard.id;

  const optionState = (optionId: string): AnswerOptionState => {
    if (!showFeedback) return "idle";
    if (optionId === activeCard.id) return "correct";
    if (optionId === selectedCardId) return "incorrect";
    return "muted";
  };

  return (
    <div className="space-y-4">
      <StudyTopBar progress={topBarProgress} progressLabel={topBarLabel} />

      <StudyPromptCard
        label="Term"
        meta={
          <span className="tabular-nums">
            {learnedCount}/{cards.length} mastered
          </span>
        }
        imageUrl={activeCard.termImageUrl}
      >
        {activeCard.term}
      </StudyPromptCard>

      <div>
        <p className="mb-3 text-sm font-semibold text-muted-foreground">
          Choose the matching definition
        </p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {optionCards.map((opt, idx) => (
            <AnswerOption
              key={opt.id}
              state={optionState(opt.id)}
              disabled={phase !== "answering"}
              shortcut={idx + 1}
              imageUrl={opt.definitionImageUrl}
              onSelect={() => selectAnswer(opt.id)}
            >
              {opt.definition}
            </AnswerOption>
          ))}
        </div>
      </div>

      <StudyFeedback
        isCorrect={showFeedback ? wasCorrect : null}
        title={wasCorrect ? "Correct!" : "Not quite — you'll see this again soon."}
      >
        {!wasCorrect ? (
          <>
            <span className="text-muted-foreground">Correct answer: </span>
            <span className="font-medium">{activeCard.definition}</span>
          </>
        ) : null}
      </StudyFeedback>

      {showFeedback ? (
        <div className="flex justify-end">
          <Button
            ref={continueRef}
            type="button"
            size="lg"
            className="w-full sm:w-auto"
            onClick={advanceQueue}
          >
            Continue
            <ArrowRight aria-hidden />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
