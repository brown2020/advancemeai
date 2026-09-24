"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, PartyPopper, ThumbsUp } from "lucide-react";
import type { Flashcard } from "@/types/flashcard";
import { Button } from "@/components/ui/button";
import { useGamification } from "@/hooks/useGamification";
import { cn } from "@/utils/cn";
import {
  buildMultipleChoiceOptions,
  formatDuration,
  percent,
  secondsSince,
} from "./study-utils";
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

function buildTest(cards: Flashcard[], questionCount: number): TestQuestion[] {
  const picked = shuffle(cards).slice(0, Math.min(questionCount, cards.length));
  return picked.map((c) => {
    const { optionCardIds, correctIndex } = buildMultipleChoiceOptions(cards, c.id, 4);
    return { cardId: c.id, optionCardIds, correctIndex, selectedIndex: null };
  });
}

type TestModeProps = {
  cards: Flashcard[];
  questionCount?: number;
  flashcardSetId?: string;
};

export function TestMode({ cards, questionCount = 10, flashcardSetId }: TestModeProps) {
  const [questions, setQuestions] = useState<TestQuestion[]>(() =>
    buildTest(cards, questionCount)
  );
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);

  const { xp, level, currentStreak, recordSessionComplete } = useGamification();
  const sessionStartTime = useRef(0);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sessionStartTime.current = Date.now();
  }, []);

  const cardById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  const answeredCount = questions.filter((q) => q.selectedIndex !== null).length;
  const score = questions.filter((q) => q.selectedIndex === q.correctIndex).length;
  const allAnswered = answeredCount === questions.length;

  const selectAnswer = (questionIndex: number, optionIndex: number) => {
    if (isSubmitted) return;
    setQuestions((prev) =>
      prev.map((q, i) => (i === questionIndex ? { ...q, selectedIndex: optionIndex } : q))
    );
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

  const scorePercentage = percent(score, questions.length);
  const isPerfect = isSubmitted && score === questions.length;

  return (
    <div ref={topRef} className="scroll-mt-24 space-y-4">
      <StudyTopBar
        progress={isSubmitted ? 100 : percent(answeredCount, questions.length)}
        progressLabel={
          isSubmitted
            ? `${score} / ${questions.length} correct`
            : `${answeredCount} / ${questions.length}`
        }
      />

      {isSubmitted ? (
        <StudyResults
          icon={isPerfect ? PartyPopper : scorePercentage >= 70 ? ThumbsUp : BookOpen}
          title={
            isPerfect
              ? "Perfect score!"
              : scorePercentage >= 70
                ? "Great job!"
                : "Keep practicing!"
          }
          message={`You got ${score} out of ${questions.length} correct.`}
          stats={[
            { label: "Score", value: `${scorePercentage}%`, tone: "primary" },
            { label: "Correct", value: score, tone: "success" },
            { label: "Incorrect", value: questions.length - score, tone: "destructive" },
            { label: "Time", value: formatDuration(durationSeconds) },
          ]}
          highlight={isPerfect ? "+50 XP bonus!" : undefined}
          rewards={{ xp, level, streak: currentStreak }}
          againLabel="New test"
          onStudyAgain={newTest}
        />
      ) : null}

      {isSubmitted ? (
        <h2 className="pt-4 text-lg font-semibold">Review your answers</h2>
      ) : null}

      <ol className="space-y-4">
        {questions.map((q, rowNo) => {
          const card = cardById.get(q.cardId);
          if (!card) return null;
          const optionCards = q.optionCardIds
            .map((id) => cardById.get(id))
            .filter((c): c is Flashcard => Boolean(c));
          const gotItRight = q.selectedIndex === q.correctIndex;

          const optionState = (optIdx: number): AnswerOptionState => {
            if (!isSubmitted) return q.selectedIndex === optIdx ? "selected" : "idle";
            if (optIdx === q.correctIndex) return "correct";
            if (optIdx === q.selectedIndex) return "incorrect";
            return "muted";
          };

          return (
            <li
              key={`${q.cardId}-${rowNo}`}
              className={cn(
                "rounded-2xl border bg-card p-5 shadow-card sm:p-6",
                isSubmitted
                  ? gotItRight
                    ? "border-success/40"
                    : "border-destructive/40"
                  : "border-border"
              )}
              aria-label={`Question ${rowNo + 1} of ${questions.length}`}
            >
              <div className="mb-3 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span>
                  Question {rowNo + 1} <span className="normal-case">of {questions.length}</span>
                </span>
                {isSubmitted ? (
                  <span className={gotItRight ? "text-success" : "text-destructive"}>
                    {gotItRight ? "Correct" : "Incorrect"}
                  </span>
                ) : null}
              </div>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-lg font-semibold">
                  {card.term}
                </p>
                {card.termImageUrl ? (
                  <img
                    src={card.termImageUrl}
                    alt=""
                    className="max-h-28 w-auto rounded-xl object-contain"
                  />
                ) : null}
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                {optionCards.map((opt, optIdx) => (
                  <AnswerOption
                    key={opt.id}
                    state={optionState(optIdx)}
                    disabled={isSubmitted}
                    imageUrl={opt.definitionImageUrl}
                    onSelect={() => selectAnswer(rowNo, optIdx)}
                  >
                    {opt.definition}
                  </AnswerOption>
                ))}
              </div>
            </li>
          );
        })}
      </ol>

      {!isSubmitted ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-5 text-center shadow-card sm:flex-row sm:justify-between sm:text-left">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {allAnswered
              ? "All questions answered. Ready when you are."
              : `${questions.length - answeredCount} question${
                  questions.length - answeredCount === 1 ? "" : "s"
                } left to answer.`}
          </p>
          <Button
            type="button"
            size="lg"
            className="w-full sm:w-auto"
            onClick={submit}
            disabled={!allAnswered}
          >
            Submit test
          </Button>
        </div>
      ) : null}
    </div>
  );
}
