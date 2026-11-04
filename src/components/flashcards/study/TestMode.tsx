"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, PartyPopper, ThumbsUp } from "lucide-react";
import type { Flashcard } from "@/types/flashcard";
import { Button } from "@/components/ui/button";
import { useGamification } from "@/hooks/useGamification";
import { cn } from "@/utils/cn";
import { buildMultipleChoiceOptions, formatDuration, secondsSince } from "./study-utils";
import { FlashcardImage } from "@/components/flashcards/study/FlashcardImage";
import { percent } from "@/utils/format";
import { shuffle } from "@/utils/random";
import { AnswerOption, type AnswerOptionState } from "./AnswerOption";
import { StudyResults } from "./StudyResults";
import { StudyTopBar } from "./StudyTopBar";

type TestQuestion = {
  cardId: string;
  optionCardIds: string[];
  correctIndex: number;
  selectedIndex: number | null;
};

type Rewards = { xp: number; level: number; streak: number };

function buildTest(cards: Flashcard[], questionCount: number): TestQuestion[] {
  const picked = shuffle(cards).slice(0, Math.min(questionCount, cards.length));
  return picked.map((card) => {
    const { optionCardIds, correctIndex } = buildMultipleChoiceOptions(cards, card.id, 4);
    return { cardId: card.id, optionCardIds, correctIndex, selectedIndex: null };
  });
}

function withSelectedOption(
  questions: readonly TestQuestion[],
  questionIndex: number,
  optionIndex: number,
): TestQuestion[] {
  const next: TestQuestion[] = [];
  for (const [index, question] of questions.entries()) {
    if (index === questionIndex) next.push({ ...question, selectedIndex: optionIndex });
    else next.push(question);
  }
  return next;
}

function countAnswered(questions: readonly TestQuestion[]): number {
  let count = 0;
  for (const question of questions) {
    if (question.selectedIndex !== null) count += 1;
  }
  return count;
}

function countCorrect(questions: readonly TestQuestion[]): number {
  let count = 0;
  for (const question of questions) {
    if (question.selectedIndex === question.correctIndex) count += 1;
  }
  return count;
}

function testProgress(isSubmitted: boolean, score: number, answeredCount: number, total: number) {
  if (isSubmitted) {
    return { progress: 100, label: `${score} / ${total} correct` };
  }
  return { progress: percent(answeredCount, total), label: `${answeredCount} / ${total}` };
}

function testResultIcon(isPerfect: boolean, scorePercentage: number) {
  if (isPerfect) return PartyPopper;
  if (scorePercentage >= 70) return ThumbsUp;
  return BookOpen;
}

function testResultTitle(isPerfect: boolean, scorePercentage: number): string {
  if (isPerfect) return "Perfect score!";
  if (scorePercentage >= 70) return "Great job!";
  return "Keep practicing!";
}

function testOptionState(
  isSubmitted: boolean,
  selectedIndex: number | null,
  correctIndex: number,
  optionIndex: number,
): AnswerOptionState {
  if (!isSubmitted) return selectedIndex === optionIndex ? "selected" : "idle";
  if (optionIndex === correctIndex) return "correct";
  if (optionIndex === selectedIndex) return "incorrect";
  return "muted";
}

function questionOptionCards(
  question: TestQuestion,
  cardById: Map<string, Flashcard>,
): Flashcard[] {
  const options: Flashcard[] = [];
  for (const id of question.optionCardIds) {
    const card = cardById.get(id);
    if (card) options.push(card);
  }
  return options;
}

function questionBorderClass(isSubmitted: boolean, gotItRight: boolean): string {
  if (!isSubmitted) return "border-border";
  if (gotItRight) return "border-success/40";
  return "border-destructive/40";
}

function remainingLabel(remaining: number): string {
  if (remaining === 1) return `${remaining} question left to answer.`;
  return `${remaining} questions left to answer.`;
}

function testSubmitMessage(allAnswered: boolean, remaining: number): string {
  if (allAnswered) return "All questions answered. Ready when you are.";
  return remainingLabel(remaining);
}

function TestSummary({
  score,
  total,
  durationSeconds,
  rewards,
  onNewTest,
}: {
  score: number;
  total: number;
  durationSeconds: number;
  rewards: Rewards;
  onNewTest: () => void;
}) {
  const scorePercentage = percent(score, total);
  const isPerfect = score === total;
  const highlight = isPerfect ? "+50 XP bonus!" : undefined;

  return (
    <StudyResults
      icon={testResultIcon(isPerfect, scorePercentage)}
      title={testResultTitle(isPerfect, scorePercentage)}
      message={`You got ${score} out of ${total} correct.`}
      stats={[
        { label: "Score", value: `${scorePercentage}%`, tone: "primary" },
        { label: "Correct", value: score, tone: "success" },
        { label: "Incorrect", value: total - score, tone: "destructive" },
        { label: "Time", value: formatDuration(durationSeconds) },
      ]}
      highlight={highlight}
      rewards={rewards}
      againLabel="New test"
      onStudyAgain={onNewTest}
    />
  );
}

function TestResultLabel({
  isSubmitted,
  gotItRight,
}: {
  isSubmitted: boolean;
  gotItRight: boolean;
}) {
  if (!isSubmitted) return null;
  const tone = gotItRight ? "text-success" : "text-destructive";
  const label = gotItRight ? "Correct" : "Incorrect";
  return <span className={tone}>{label}</span>;
}

function TestQuestionItem({
  question,
  rowNo,
  questionCount,
  cardById,
  isSubmitted,
  onSelect,
}: {
  question: TestQuestion;
  rowNo: number;
  questionCount: number;
  cardById: Map<string, Flashcard>;
  isSubmitted: boolean;
  onSelect: (questionIndex: number, optionIndex: number) => void;
}) {
  const card = cardById.get(question.cardId);
  if (!card) return null;
  const options = questionOptionCards(question, cardById);
  const gotItRight = question.selectedIndex === question.correctIndex;

  return (
    <li
      className={cn(
        "rounded-2xl border bg-card p-5 shadow-card sm:p-6",
        questionBorderClass(isSubmitted, gotItRight),
      )}
      aria-label={`Question ${rowNo + 1} of ${questionCount}`}
    >
      <div className="mb-3 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <span>
          Question {rowNo + 1} <span className="normal-case">of {questionCount}</span>
        </span>
        <TestResultLabel isSubmitted={isSubmitted} gotItRight={gotItRight} />
      </div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-lg font-semibold">
          {card.term}
        </p>
        <FlashcardImage src={card.termImageUrl} className="max-h-28 w-auto rounded-xl object-contain" />
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {options.map((option, optionIndex) => (
          <AnswerOption
            key={option.id}
            state={testOptionState(
              isSubmitted,
              question.selectedIndex,
              question.correctIndex,
              optionIndex,
            )}
            disabled={isSubmitted}
            imageUrl={option.definitionImageUrl}
            onSelect={() => onSelect(rowNo, optionIndex)}
          >
            {option.definition}
          </AnswerOption>
        ))}
      </div>
    </li>
  );
}

function TestSubmitBar({
  isSubmitted,
  allAnswered,
  remaining,
  onSubmit,
}: {
  isSubmitted: boolean;
  allAnswered: boolean;
  remaining: number;
  onSubmit: () => void;
}) {
  if (isSubmitted) return null;
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-5 text-center shadow-card sm:flex-row sm:justify-between sm:text-left">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {testSubmitMessage(allAnswered, remaining)}
      </p>
      <Button
        type="button"
        size="lg"
        className="w-full sm:w-auto"
        onClick={onSubmit}
        disabled={!allAnswered}
      >
        Submit test
      </Button>
    </div>
  );
}

type TestModeProps = {
  cards: Flashcard[];
  questionCount?: number;
  flashcardSetId?: string;
};

export function TestMode({ cards, questionCount = 10, flashcardSetId }: TestModeProps) {
  const [questions, setQuestions] = useState<TestQuestion[]>(() => buildTest(cards, questionCount));
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);

  const { xp, level, currentStreak, recordSessionComplete } = useGamification();
  const sessionStartTime = useRef(0);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sessionStartTime.current = Date.now();
  }, []);

  const cardById = useMemo(() => new Map(cards.map((card) => [card.id, card])), [cards]);
  const answeredCount = countAnswered(questions);
  const score = countCorrect(questions);
  const allAnswered = answeredCount === questions.length;
  const bar = testProgress(isSubmitted, score, answeredCount, questions.length);
  const rewards = { xp, level, streak: currentStreak };

  const selectAnswer = (questionIndex: number, optionIndex: number) => {
    if (isSubmitted) return;
    setQuestions((prev) => withSelectedOption(prev, questionIndex, optionIndex));
  };

  const submit = () => {
    if (isSubmitted || !allAnswered) return;
    const duration = secondsSince(sessionStartTime.current);
    setDurationSeconds(duration);
    setIsSubmitted(true);
    void recordSessionComplete({
      questionsAnswered: questions.length,
      questionsCorrect: score,
      isPerfectScore: score === questions.length,
      durationSeconds: duration,
      flashcardSetId,
    });
    topRef.current?.scrollIntoView({ block: "start" });
  };

  const newTest = () => {
    setQuestions(buildTest(cards, questionCount));
    setIsSubmitted(false);
    sessionStartTime.current = Date.now();
    topRef.current?.scrollIntoView({ block: "start" });
  };

  if (!cards.length) return null;

  return (
    <div ref={topRef} className="scroll-mt-24 space-y-4">
      <StudyTopBar progress={bar.progress} progressLabel={bar.label} />

      {isSubmitted ? (
        <TestSummary
          score={score}
          total={questions.length}
          durationSeconds={durationSeconds}
          rewards={rewards}
          onNewTest={newTest}
        />
      ) : null}

      {isSubmitted ? <h2 className="pt-4 text-lg font-semibold">Review your answers</h2> : null}

      <ol className="space-y-4">
        {questions.map((question, rowNo) => (
          <TestQuestionItem
            key={`${question.cardId}-${rowNo}`}
            question={question}
            rowNo={rowNo}
            questionCount={questions.length}
            cardById={cardById}
            isSubmitted={isSubmitted}
            onSelect={selectAnswer}
          />
        ))}
      </ol>

      <TestSubmitBar
        isSubmitted={isSubmitted}
        allAnswered={allAnswered}
        remaining={questions.length - answeredCount}
        onSubmit={submit}
      />
    </div>
  );
}
