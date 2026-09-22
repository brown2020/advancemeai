"use client";

import { useEffect, useMemo, useState, useRef, useCallback, useReducer} from "react";
import type { Flashcard } from "@/types/flashcard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";
import { shuffle } from "./study-utils";
import { isAnswerCorrect } from "@/lib/utils/answerMatching";
import { useGamification } from "@/hooks/useGamification";
import { StreakCounter, XPBadge } from "@/components/gamification";
import { Check, X, Eye, ArrowRight, RotateCcw, Settings2 } from "lucide-react";

type WriteQuestion = {
  card: Flashcard;
  userAnswer: string;
  isCorrect: boolean | null;
  feedback: string;
  skipped: boolean;
};

type Phase = "studying" | "review" | "complete";

export function WriteMode({
  cards,
  flashcardSetId,
}: {
  cards: Flashcard[];
  flashcardSetId?: string;
}) {
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
    questions: [],
    currentIndex: 0,
    phase: "studying",
    inputValue: "",
    showAnswer: false,
    strictMode: false,
    showSettings: false,
    }
  );
  const { questions, currentIndex, phase, inputValue, showAnswer, strictMode, showSettings } = state as any;
  const assignQuestions = (value: any) => dispatch({ questions: value });
  const assignCurrentIndex = (value: any) => dispatch({ currentIndex: value });
  const assignPhase = (value: any) => dispatch({ phase: value });
  const assignInputValue = (value: any) => dispatch({ inputValue: value });
  const assignShowAnswer = (value: any) => dispatch({ showAnswer: value });
  const assignStrictMode = (value: any) => dispatch({ strictMode: value });
  const assignShowSettings = (value: any) => dispatch({ showSettings: value });


  // Gamification
  const { xp, level, currentStreak, recordSessionComplete, awardXP } = useGamification();
  const sessionStartTime = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize questions
  useEffect(() => {
    if (!cards.length) return;
    const shuffled = shuffle(cards);
    assignQuestions(
      shuffled.map((card) => ({
        card,
        userAnswer: "",
        isCorrect: null,
        feedback: "",
        skipped: false,
      }))
    );
    assignCurrentIndex(0);
    assignPhase("studying");
    assignInputValue("");
    assignShowAnswer(false);
    sessionStartTime.current = Date.now();
  }, [cards]);

  // Focus input when question changes
  useEffect(() => {
    if (phase === "studying" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, phase]);

  const currentQuestion = questions[currentIndex];

  const stats = useMemo(() => {
    const correct = questions.filter((q) => q.isCorrect === true).length;
    const incorrect = questions.filter((q) => q.isCorrect === false).length;
    const skipped = questions.filter((q) => q.skipped).length;
    return { correct, incorrect, skipped, total: questions.length };
  }, [questions]);

  const handleSubmit = useCallback(() => {
    if (!currentQuestion || currentQuestion.isCorrect !== null) return;

    const result = isAnswerCorrect(inputValue, currentQuestion.card.definition, {
      strictMode,
    });

    // Update question
    assignQuestions((prev) =>
      prev.map((q, i) =>
        i === currentIndex
          ? {
              ...q,
              userAnswer: inputValue,
              isCorrect: result.isCorrect,
              feedback: result.feedback,
            }
          : q
      )
    );

    // Award XP if correct
    if (result.isCorrect) {
      awardXP("card-studied");
    }

    assignShowAnswer(true);
  }, [currentQuestion, currentIndex, inputValue, strictMode, awardXP]);

  const handleSkip = useCallback(() => {
    if (!currentQuestion) return;

    assignQuestions((prev) =>
      prev.map((q, i) =>
        i === currentIndex
          ? {
              ...q,
              skipped: true,
              isCorrect: false,
              feedback: `Skipped. The answer was: ${q.card.definition}`,
            }
          : q
      )
    );
    assignShowAnswer(true);
  }, [currentQuestion, currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      assignCurrentIndex((prev) => prev + 1);
      assignInputValue("");
      assignShowAnswer(false);
    } else {
      // Check if there are incorrect answers to review
      const incorrectQuestions = questions.filter(
        (q) => q.isCorrect === false && !q.skipped
      );
      if (incorrectQuestions.length > 0 && phase === "studying") {
        assignPhase("review");
        // Reset for review
        assignQuestions((prev) =>
          prev
            .filter((q) => q.isCorrect === false && !q.skipped)
            .map((q) => ({ ...q, isCorrect: null, feedback: "", userAnswer: "" }))
        );
        assignCurrentIndex(0);
        assignInputValue("");
        assignShowAnswer(false);
      } else {
        // Complete
        assignPhase("complete");
        const durationSeconds = Math.floor(
          (Date.now() - sessionStartTime.current) / 1000
        );
        const isPerfect = stats.incorrect === 0 && stats.skipped === 0;
        recordSessionComplete({
          cardsStudied: stats.total,
          isPerfectScore: isPerfect,
          durationSeconds,
          flashcardSetId,
        });
      }
    }
  }, [currentIndex, questions, phase, stats, recordSessionComplete]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        if (showAnswer) {
          handleNext();
        } else if (inputValue.trim()) {
          handleSubmit();
        }
      }
    },
    [showAnswer, inputValue, handleNext, handleSubmit]
  );

  const restartStudy = useCallback(() => {
    const shuffled = shuffle(cards);
    assignQuestions(
      shuffled.map((card) => ({
        card,
        userAnswer: "",
        isCorrect: null,
        feedback: "",
        skipped: false,
      }))
    );
    assignCurrentIndex(0);
    assignPhase("studying");
    assignInputValue("");
    assignShowAnswer(false);
    sessionStartTime.current = Date.now();
  }, [cards]);

  if (!cards.length) return null;

  if (phase === "complete") {
    const accuracy = Math.round((stats.correct / stats.total) * 100);
    const isPerfect = stats.incorrect === 0 && stats.skipped === 0;

    return (
      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6">
        <div className="text-center space-y-4">
          <div className="text-5xl mb-2">{isPerfect ? "🎉" : accuracy >= 70 ? "👏" : "📝"}</div>
          <h2 className="text-2xl font-bold">
            {isPerfect ? "Perfect!" : accuracy >= 70 ? "Great job!" : "Keep practicing!"}
          </h2>

          <div className="flex justify-center gap-4">
            <StreakCounter streak={currentStreak} size="md" />
            <XPBadge xp={xp} level={level} />
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
            <div className="text-center p-3 rounded-lg bg-emerald-500/10">
              <div className="text-2xl font-bold text-emerald-600">{stats.correct}</div>
              <div className="text-xs text-muted-foreground">Correct</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-destructive/10">
              <div className="text-2xl font-bold text-destructive">{stats.incorrect}</div>
              <div className="text-xs text-muted-foreground">Incorrect</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{stats.skipped}</div>
              <div className="text-xs text-muted-foreground">Skipped</div>
            </div>
          </div>

          <p className="text-muted-foreground">
            Accuracy: {accuracy}%
          </p>

          <div className="flex gap-2 justify-center pt-4">
            <Button onClick={restartStudy}>
              <RotateCcw size={16} className="mr-2" />
              Study Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const progressPct = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              {phase === "review" ? "REVIEW MODE" : "WRITE"}
            </div>
            <div className="text-sm text-muted-foreground">
              {currentIndex + 1} of {questions.length}
              {phase === "review" && " (reviewing mistakes)"}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => assignShowSettings(!showSettings)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Settings"
            >
              <Settings2 size={18} className="text-muted-foreground" />
            </button>
            <StreakCounter streak={currentStreak} size="sm" showLabel={false} />
            <XPBadge xp={xp} level={level} />
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="mb-3 p-3 rounded-lg bg-muted/50">
            <label htmlFor="lbl-WriteMode-299" className="flex items-center gap-2 cursor-pointer">
              <input id="lbl-WriteMode-299"
                type="checkbox"
                checked={strictMode}
                onChange={(e) => assignStrictMode(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">
                Strict mode (exact match only, no typo tolerance)
              </span>
            </label>
          </div>
        )}

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6">
        <div className="mb-6">
          <div className="text-xs text-muted-foreground mb-2">TERM</div>
          <div className="text-xl font-semibold whitespace-pre-wrap break-words">
            {currentQuestion.card.term}
          </div>
        </div>

        {/* Answer input */}
        <div className="space-y-4">
          <div>
            <label htmlFor="lbl-WriteMode-334" className="text-sm text-muted-foreground mb-2 block">
              Type the definition
            </label>
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => assignInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter your answer..."
              disabled={showAnswer}
              className={cn(
                "text-base",
                showAnswer && currentQuestion.isCorrect && "border-emerald-500",
                showAnswer && !currentQuestion.isCorrect && "border-destructive"
              )}
            />
          </div>

          {/* Feedback */}
          {showAnswer && (
            <div
              className={cn(
                "p-4 rounded-lg",
                currentQuestion.isCorrect
                  ? "bg-emerald-500/10 border border-emerald-500/20"
                  : "bg-destructive/10 border border-destructive/20"
              )}
            >
              <div className="flex items-start gap-3">
                {currentQuestion.isCorrect ? (
                  <Check className="text-emerald-600 shrink-0 mt-0.5" size={20} />
                ) : (
                  <X className="text-destructive shrink-0 mt-0.5" size={20} />
                )}
                <div>
                  <p className="font-medium">{currentQuestion.feedback}</p>
                  {!currentQuestion.isCorrect && (
                    <p className="mt-2 text-sm">
                      <span className="text-muted-foreground">Correct answer: </span>
                      <span className="font-medium">
                        {currentQuestion.card.definition}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            {!showAnswer ? (
              <>
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-muted-foreground"
                >
                  <Eye size={16} className="mr-2" />
                  Don&apos;t know
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!inputValue.trim()}
                >
                  Check
                </Button>
              </>
            ) : (
              <Button onClick={handleNext}>
                {currentIndex < questions.length - 1 ? (
                  <>
                    Next
                    <ArrowRight size={16} className="ml-2" />
                  </>
                ) : phase === "studying" &&
                  questions.some((q) => q.isCorrect === false && !q.skipped) ? (
                  "Review Mistakes"
                ) : (
                  "Finish"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

