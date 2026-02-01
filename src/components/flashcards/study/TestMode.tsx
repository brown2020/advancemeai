"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import type { Flashcard } from "@/types/flashcard";
import { Button } from "@/components/ui/button";
import { buildMultipleChoiceOptions, shuffle } from "./study-utils";
import { cn } from "@/utils/cn";
import { useGamification } from "@/hooks/useGamification";
import { StreakCounter, XPBadge } from "@/components/gamification";

type TestQuestion = {
  cardId: string;
  optionCardIds: string[];
  correctIndex: number;
  selectedIndex: number | null;
};

export function TestMode({
  cards,
  questionCount = 10,
}: {
  cards: Flashcard[];
  questionCount?: number;
}) {
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Gamification
  const { xp, level, currentStreak, recordSessionComplete } = useGamification();
  const sessionStartTime = useRef<number>(0);
  const hasRecordedSession = useRef(false);

  const cardById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  useEffect(() => {
    if (!cards.length) return;
    const picked = shuffle(cards).slice(0, Math.min(questionCount, cards.length));
    const qs: TestQuestion[] = picked.map((c) => {
      const { optionCardIds, correctIndex } = buildMultipleChoiceOptions(cards, c.id, 4);
      return { cardId: c.id, optionCardIds, correctIndex, selectedIndex: null };
    });
    setQuestions(qs);
    setIsSubmitted(false);
    hasRecordedSession.current = false;
    sessionStartTime.current = Date.now();
  }, [cards, questionCount]);

  const score = useMemo(() => {
    if (!isSubmitted) return null;
    return questions.reduce((sum, q) => sum + (q.selectedIndex === q.correctIndex ? 1 : 0), 0);
  }, [isSubmitted, questions]);

  const answeredCount = useMemo(() => {
    return questions.reduce((sum, q) => sum + (q.selectedIndex !== null ? 1 : 0), 0);
  }, [questions]);

  // Record session when submitted
  useEffect(() => {
    if (isSubmitted && score !== null && !hasRecordedSession.current) {
      hasRecordedSession.current = true;
      const durationSeconds = Math.floor((Date.now() - sessionStartTime.current) / 1000);
      const isPerfect = score === questions.length;

      recordSessionComplete({
        questionsAnswered: questions.length,
        questionsCorrect: score,
        isPerfectScore: isPerfect,
        durationSeconds,
      });
    }
  }, [isSubmitted, score, questions.length, recordSessionComplete]);

  if (!cards.length) return null;

  if (!questions.length) {
    return (
      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6">
        <p className="text-muted-foreground">Preparing your test…</p>
      </div>
    );
  }

  const isPerfect = isSubmitted && score === questions.length;
  const scorePercentage = isSubmitted && score !== null
    ? Math.round((score / questions.length) * 100)
    : null;

  return (
    <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Test</h2>
          <p className="text-sm text-muted-foreground">
            {!isSubmitted
              ? `Answered ${answeredCount}/${questions.length}`
              : `Score: ${score}/${questions.length} (${scorePercentage}%)`
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StreakCounter streak={currentStreak} size="sm" showLabel={false} />
          <XPBadge xp={xp} level={level} />
          <div className="flex gap-2">
            {!isSubmitted ? (
              <Button
                type="button"
                onClick={() => setIsSubmitted(true)}
                disabled={answeredCount !== questions.length}
              >
                Submit
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const picked = shuffle(cards).slice(
                    0,
                    Math.min(questionCount, cards.length)
                  );
                  setQuestions(
                    picked.map((c) => {
                      const { optionCardIds, correctIndex } = buildMultipleChoiceOptions(
                        cards,
                        c.id,
                        4
                      );
                      return {
                        cardId: c.id,
                        optionCardIds,
                        correctIndex,
                        selectedIndex: null,
                      };
                    })
                  );
                  setIsSubmitted(false);
                  hasRecordedSession.current = false;
                  sessionStartTime.current = Date.now();
                }}
              >
                New test
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Results summary when submitted */}
      {isSubmitted && score !== null && (
        <div className={cn(
          "mb-6 p-4 rounded-xl",
          isPerfect
            ? "bg-emerald-500/10 border border-emerald-500/20"
            : scorePercentage && scorePercentage >= 70
              ? "bg-blue-500/10 border border-blue-500/20"
              : "bg-orange-500/10 border border-orange-500/20"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">
                {isPerfect ? "🎉" : scorePercentage && scorePercentage >= 70 ? "👍" : "📚"}
              </span>
              <div>
                <p className="font-semibold">
                  {isPerfect
                    ? "Perfect score!"
                    : scorePercentage && scorePercentage >= 70
                      ? "Great job!"
                      : "Keep practicing!"
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  You got {score} out of {questions.length} correct
                </p>
              </div>
            </div>
            {isPerfect && (
              <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                +50 XP bonus!
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {questions.map((q, idx) => {
          const card = cardById.get(q.cardId);
          if (!card) return null;
          const optionCards = q.optionCardIds.map((id) => cardById.get(id)).filter(Boolean) as Flashcard[];

          return (
            <div key={`${q.cardId}-${idx}`} className="rounded-xl border border-border p-4">
              <div className="text-xs text-muted-foreground mb-1">QUESTION {idx + 1}</div>
              <div className="font-medium mb-3 whitespace-pre-wrap break-words">{card.term}</div>

              <div className="grid gap-2">
                {optionCards.map((opt, optIdx) => {
                  const isSelected = q.selectedIndex === optIdx;
                  const isCorrect = q.correctIndex === optIdx;

                  const border =
                    isSubmitted && isCorrect
                      ? "border-emerald-500"
                      : isSubmitted && isSelected && !isCorrect
                        ? "border-destructive"
                        : "border-border";

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={cn(
                        "text-left rounded-xl border bg-background p-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        "hover:bg-accent hover:text-accent-foreground",
                        border,
                        isSubmitted && "cursor-default hover:bg-background hover:text-foreground"
                      )}
                      disabled={isSubmitted}
                      onClick={() => {
                        setQuestions((prev) =>
                          prev.map((x, xIdx) =>
                            xIdx === idx ? { ...x, selectedIndex: optIdx } : x
                          )
                        );
                      }}
                    >
                      <div className="whitespace-pre-wrap break-words">{opt.definition}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
