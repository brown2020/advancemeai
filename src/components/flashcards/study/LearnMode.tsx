"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowRight, PartyPopper, Target, Trophy } from "lucide-react";
import type { Flashcard } from "@/types/flashcard";
import type { XPEventType } from "@/types/gamification";
import { Button } from "@/components/ui/button";
import { useGamification } from "@/hooks/useGamification";
import {
  buildMultipleChoiceOptions,
  clampMastery,
  formatDuration,
  secondsSince,
  type MasteryLevel,
  type MasteryMap,
} from "./study-utils";
import { percent } from "@/utils/format";
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

type LearnSessionStats = {
  cardsStudied: number;
  cardsMastered: number;
  correctAnswers: number;
};

type Rewards = { xp: number; level: number; streak: number };

const EMPTY_STATS: SessionStats = {
  cardsStudied: 0,
  cardsMastered: 0,
  correctAnswers: 0,
  durationSeconds: 0,
};

const EMPTY_SESSION: LearnSessionStats = {
  cardsStudied: 0,
  cardsMastered: 0,
  correctAnswers: 0,
};

type LearnModeProps = {
  cards: Flashcard[];
  masteryByCardId: MasteryMap;
  onSetMastery: (cardId: string, mastery: MasteryLevel) => void;
  onResetProgress?: () => void;
  flashcardSetId?: string;
};

function belowMastery(masteryByCardId: MasteryMap, cardId: string): boolean {
  return (masteryByCardId[cardId] ?? 0) < 3;
}

function compareMastery(
  masteryByCardId: MasteryMap,
  left: Flashcard,
  right: Flashcard,
): number {
  return (masteryByCardId[left.id] ?? 0) - (masteryByCardId[right.id] ?? 0);
}

function limitForGoal(ranked: Flashcard[], selectedGoal: LearnGoal): Flashcard[] {
  if (selectedGoal.type !== "count") return ranked;
  return ranked.slice(0, selectedGoal.value);
}

/** Unmastered cards, lowest mastery first, trimmed to a count goal. */
function cardsForLearnGoal(
  cards: readonly Flashcard[],
  masteryByCardId: MasteryMap,
  selectedGoal: LearnGoal,
): string[] {
  const ranked = cards.filter((card) => belowMastery(masteryByCardId, card.id));
  ranked.sort((left, right) => compareMastery(masteryByCardId, left, right));
  return limitForGoal(ranked, selectedGoal).map((card) => card.id);
}

function countAtMastery(
  cards: readonly Flashcard[],
  masteryByCardId: MasteryMap,
  level: MasteryLevel,
): number {
  let count = 0;
  for (const card of cards) {
    if (masteryByCardId[card.id] === level) count += 1;
  }
  return count;
}

function countUnmastered(cards: readonly Flashcard[], masteryByCardId: MasteryMap): number {
  let count = 0;
  for (const card of cards) {
    if (belowMastery(masteryByCardId, card.id)) count += 1;
  }
  return count;
}

function lookupCard(
  cardById: Map<string, Flashcard>,
  cardId: string | null,
): Flashcard | null {
  if (!cardId) return null;
  return cardById.get(cardId) ?? null;
}

function learnChoices(
  cards: readonly Flashcard[],
  cardById: Map<string, Flashcard>,
  activeCard: Flashcard | null,
): Flashcard[] {
  if (!activeCard) return [];
  const { optionCardIds } = buildMultipleChoiceOptions(cards, activeCard.id, 4);
  const choices: Flashcard[] = [];
  for (const id of optionCardIds) {
    const card = cardById.get(id);
    if (card) choices.push(card);
  }
  return choices;
}

function learnTopBar(
  goal: LearnGoal,
  goalMasteredCount: number,
  learnedCount: number,
  totalCount: number,
): { progress: number; label: string } {
  if (goal.type === "count") {
    return {
      progress: Math.min(100, percent(goalMasteredCount, goal.value)),
      label: `${goalMasteredCount} / ${goal.value}`,
    };
  }
  return {
    progress: percent(learnedCount, totalCount),
    label: `${learnedCount} / ${totalCount}`,
  };
}

function firstCardId(ordered: readonly string[]): string | null {
  return ordered[0] ?? null;
}

function openingPhase(cardId: string | null): Phase {
  if (cardId) return "answering";
  return "complete";
}

function masteryAfterAnswer(currentMastery: number, wasCorrect: boolean): MasteryLevel {
  return clampMastery(currentMastery + (wasCorrect ? 1 : -1));
}

function isNewlyMastered(nextMastery: MasteryLevel, currentMastery: number): boolean {
  return nextMastery === 3 && currentMastery < 3;
}

function withoutId(queue: readonly string[], activeCardId: string): string[] {
  const rest: string[] = [];
  for (const id of queue) {
    if (id !== activeCardId) rest.push(id);
  }
  return rest;
}

/** Mastered cards leave the rotation; misses come back sooner. */
function queueAfterAnswer(
  queue: readonly string[],
  activeCardId: string,
  nextMastery: MasteryLevel,
  wasCorrect: boolean,
): string[] {
  const rest = withoutId(queue, activeCardId);
  if (nextMastery === 3) return rest;
  if (wasCorrect) return [...rest, activeCardId];
  return [...rest.slice(0, 2), activeCardId, ...rest.slice(2)];
}

function isLearnGoalReached(goal: LearnGoal, masteredCount: number): boolean {
  return goal.type === "count" && masteredCount >= goal.value;
}

function nextCardId(reached: boolean, nextQueue: readonly string[]): string | null {
  if (reached) return null;
  return nextQueue[0] ?? null;
}

function studyPhaseAfterAdvance(nextId: string | null): Phase {
  if (nextId) return "answering";
  return "complete";
}

function applyLearnScore(
  stats: LearnSessionStats,
  wasCorrect: boolean,
  newlyMastered: boolean,
  awardXP: (eventType: XPEventType) => void,
): number {
  stats.cardsStudied += 1;
  if (wasCorrect) {
    stats.correctAnswers += 1;
    awardXP("card-studied");
  }
  if (!newlyMastered) return 0;
  stats.cardsMastered += 1;
  awardXP("card-mastered");
  return 1;
}

function learnOptionState(
  showFeedback: boolean,
  activeCardId: string,
  selectedCardId: string | null,
  optionId: string,
): AnswerOptionState {
  if (!showFeedback) return "idle";
  if (optionId === activeCardId) return "correct";
  if (optionId === selectedCardId) return "incorrect";
  return "muted";
}

function selectIndexedCard(
  cards: readonly Flashcard[],
  index: number,
  selectAnswer: (cardId: string) => void,
) {
  const card = cards[index];
  if (card) selectAnswer(card.id);
}

function focusContinue(phase: Phase, button: HTMLButtonElement | null) {
  if (phase === "feedback") button?.focus();
}

function learnCompleteIcon(goalReached: boolean) {
  if (goalReached) return Target;
  return Trophy;
}

function learnCompleteTitle(goalReached: boolean): string {
  if (goalReached) return "Goal reached!";
  return "Session complete!";
}

function learnAgainLabel(unmasteredCount: number): string {
  if (unmasteredCount > 0) return `Keep learning (${unmasteredCount} left)`;
  return "Study again";
}

function LearnGoalView({
  learnedCount,
  totalCount,
  unmasteredCount,
  rewards,
  onStart,
  onResetProgress,
}: {
  learnedCount: number;
  totalCount: number;
  unmasteredCount: number;
  rewards: Rewards;
  onStart: (goal: LearnGoal) => void;
  onResetProgress?: () => void;
}) {
  return (
    <div className="space-y-4">
      <StudyTopBar
        progress={percent(learnedCount, totalCount)}
        progressLabel={`${learnedCount} / ${totalCount}`}
      />
      <LearnGoalPicker
        unmasteredCount={unmasteredCount}
        learnedCount={learnedCount}
        totalCount={totalCount}
        rewards={rewards}
        onStart={onStart}
        onResetProgress={onResetProgress}
      />
    </div>
  );
}

function LearnCompleteView({
  stats,
  goal,
  goalMasteredCount,
  learnedCount,
  totalCount,
  unmasteredCount,
  progress,
  progressLabel,
  rewards,
  onStudyAgain,
}: {
  stats: SessionStats;
  goal: LearnGoal;
  goalMasteredCount: number;
  learnedCount: number;
  totalCount: number;
  unmasteredCount: number;
  progress: number;
  progressLabel: string;
  rewards: Rewards;
  onStudyAgain: () => void;
}) {
  const isPerfect = stats.correctAnswers === stats.cardsStudied && stats.cardsStudied > 0;
  const reached = goal.type === "count" && goalMasteredCount >= goal.value;
  let highlight: ReactNode = undefined;
  if (isPerfect) {
    highlight = (
      <>
        <PartyPopper className="size-4" aria-hidden />
        Perfect score! +50 XP bonus
      </>
    );
  } else if (goal.type === "count" && !reached) {
    highlight = `Progress: ${goalMasteredCount}/${goal.value} terms mastered`;
  }

  return (
    <div className="space-y-4">
      <StudyTopBar progress={progress} progressLabel={progressLabel} />
      <StudyResults
        icon={learnCompleteIcon(reached)}
        title={learnCompleteTitle(reached)}
        message={`You've mastered ${learnedCount} of ${totalCount} terms in this set.`}
        stats={[
          { label: "Studied", value: stats.cardsStudied, tone: "primary" },
          { label: "Newly mastered", value: stats.cardsMastered, tone: "success" },
          {
            label: "Accuracy",
            value: `${percent(stats.correctAnswers, stats.cardsStudied)}%`,
          },
          { label: "Time", value: formatDuration(stats.durationSeconds) },
        ]}
        highlight={highlight}
        rewards={rewards}
        againLabel={learnAgainLabel(unmasteredCount)}
        onStudyAgain={onStudyAgain}
      />
    </div>
  );
}

function LearnQuestionView({
  activeCard,
  optionCards,
  phase,
  selectedCardId,
  learnedCount,
  totalCount,
  progress,
  progressLabel,
  continueRef,
  onSelect,
  onContinue,
}: {
  activeCard: Flashcard;
  optionCards: Flashcard[];
  phase: Phase;
  selectedCardId: string | null;
  learnedCount: number;
  totalCount: number;
  progress: number;
  progressLabel: string;
  continueRef: React.RefObject<HTMLButtonElement | null>;
  onSelect: (cardId: string) => void;
  onContinue: () => void;
}) {
  const showFeedback = phase === "feedback";
  const wasCorrect = selectedCardId === activeCard.id;

  return (
    <div className="space-y-4">
      <StudyTopBar progress={progress} progressLabel={progressLabel} />

      <StudyPromptCard
        label="Term"
        meta={
          <span className="tabular-nums">
            {learnedCount}/{totalCount} mastered
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
          {optionCards.map((option, index) => (
            <AnswerOption
              key={option.id}
              state={learnOptionState(showFeedback, activeCard.id, selectedCardId, option.id)}
              disabled={phase !== "answering"}
              shortcut={index + 1}
              imageUrl={option.definitionImageUrl}
              onSelect={() => onSelect(option.id)}
            >
              {option.definition}
            </AnswerOption>
          ))}
        </div>
      </div>

      <StudyFeedback
        isCorrect={showFeedback ? wasCorrect : null}
        title={wasCorrect ? "Correct!" : "Not quite — you'll see this again soon."}
      >
        {wasCorrect ? null : (
          <>
            <span className="text-muted-foreground">Correct answer: </span>
            <span className="font-medium">{activeCard.definition}</span>
          </>
        )}
      </StudyFeedback>

      {showFeedback ? (
        <div className="flex justify-end">
          <Button
            ref={continueRef}
            type="button"
            size="lg"
            className="w-full sm:w-auto"
            onClick={onContinue}
          >
            Continue
            <ArrowRight aria-hidden />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function LearnMode({
  cards,
  masteryByCardId,
  onSetMastery,
  onResetProgress,
  flashcardSetId,
}: LearnModeProps) {
  const [phase, setPhase] = useState<Phase>("goal-selection");
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [goal, setGoal] = useState<LearnGoal>({ type: "all" });
  const [goalMasteredCount, setGoalMasteredCount] = useState(0);
  const [finalStats, setFinalStats] = useState<SessionStats>(EMPTY_STATS);

  const { xp, level, currentStreak, recordSessionComplete, awardXP } = useGamification();
  const sessionStats = useRef<LearnSessionStats>(EMPTY_SESSION);
  const sessionStartTime = useRef(0);
  const continueRef = useRef<HTMLButtonElement>(null);
  const queueRef = useRef<string[]>([]);

  const cardById = useMemo(() => new Map(cards.map((card) => [card.id, card])), [cards]);
  const learnedCount = useMemo(
    () => countAtMastery(cards, masteryByCardId, 3),
    [cards, masteryByCardId],
  );
  const unmasteredCount = countUnmastered(cards, masteryByCardId);
  const activeCard = lookupCard(cardById, activeCardId);
  const optionCards = useMemo(
    () => learnChoices(cards, cardById, activeCard),
    [activeCard, cardById, cards],
  );
  const rewards = { xp, level, streak: currentStreak };
  const topBar = learnTopBar(goal, goalMasteredCount, learnedCount, cards.length);

  const startLearning = (selectedGoal: LearnGoal) => {
    setGoal(selectedGoal);
    setGoalMasteredCount(0);
    sessionStats.current = { ...EMPTY_SESSION };
    sessionStartTime.current = Date.now();
    const ordered = cardsForLearnGoal(cards, masteryByCardId, selectedGoal);
    queueRef.current = ordered;
    const cardId = firstCardId(ordered);
    setActiveCardId(cardId);
    setPhase(openingPhase(cardId));
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
    const nextMastery = masteryAfterAnswer(currentMastery, wasCorrect);
    onSetMastery(activeCard.id, nextMastery);

    const masteredDelta = applyLearnScore(
      sessionStats.current,
      wasCorrect,
      isNewlyMastered(nextMastery, currentMastery),
      awardXP,
    );
    const updatedGoalMastered = goalMasteredCount + masteredDelta;
    if (masteredDelta > 0) setGoalMasteredCount(updatedGoalMastered);

    const nextQueue = queueAfterAnswer(queueRef.current, activeCard.id, nextMastery, wasCorrect);
    const nextId = nextCardId(isLearnGoalReached(goal, updatedGoalMastered), nextQueue);
    queueRef.current = nextQueue;
    setActiveCardId(nextId);

    if (!nextId) {
      const durationSeconds = secondsSince(sessionStartTime.current);
      void recordSessionComplete({
        cardsStudied: sessionStats.current.cardsStudied,
        cardsMastered: sessionStats.current.cardsMastered,
        isPerfectScore: sessionStats.current.correctAnswers === sessionStats.current.cardsStudied,
        durationSeconds,
        flashcardSetId,
      });
      setFinalStats({ ...sessionStats.current, durationSeconds });
    }

    setPhase(studyPhaseAfterAdvance(nextId));
    setSelectedCardId(null);
  };

  useChoiceShortcuts(phase === "answering", optionCards.length, (index) => {
    selectIndexedCard(optionCards, index, selectAnswer);
  });

  // Move focus to "Continue" so Enter advances after answering.
  useEffect(() => {
    focusContinue(phase, continueRef.current);
  }, [phase]);

  if (!cards.length) return null;

  if (phase === "goal-selection") {
    return (
      <LearnGoalView
        learnedCount={learnedCount}
        totalCount={cards.length}
        unmasteredCount={unmasteredCount}
        rewards={rewards}
        onStart={startLearning}
        onResetProgress={onResetProgress}
      />
    );
  }

  if (phase === "complete") {
    return (
      <LearnCompleteView
        stats={finalStats}
        goal={goal}
        goalMasteredCount={goalMasteredCount}
        learnedCount={learnedCount}
        totalCount={cards.length}
        unmasteredCount={unmasteredCount}
        progress={topBar.progress}
        progressLabel={topBar.label}
        rewards={rewards}
        onStudyAgain={() => setPhase("goal-selection")}
      />
    );
  }

  if (!activeCard) return null;

  return (
    <LearnQuestionView
      activeCard={activeCard}
      optionCards={optionCards}
      phase={phase}
      selectedCardId={selectedCardId}
      learnedCount={learnedCount}
      totalCount={cards.length}
      progress={topBar.progress}
      progressLabel={topBar.label}
      continueRef={continueRef}
      onSelect={selectAnswer}
      onContinue={advanceQueue}
    />
  );
}
