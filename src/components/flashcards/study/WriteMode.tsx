"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
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

export function WriteMode({ cards }: { cards: Flashcard[] }) {
  const [questions, setQuestions] = useState<WriteQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("studying");
  const [inputValue, setInputValue] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [strictMode, setStrictMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Gamification
  const { xp, level, currentStreak, recordSessionComplete, awardXP } = useGamification();
  const sessionStartTime = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize questions
  useEffect(() => {
    if (!cards.length) return;
    const shuffled = shuffle(cards);
    setQuestions(
      shuffled.map((card) => ({
        card,
        userAnswer: "",
        isCorrect: null,
        feedback: "",
        skipped: false,
      }))
    );
    setCurrentIndex(0);
    setPhase("studying");
    setInputValue("");
    setShowAnswer(false);
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
    setQuestions((prev) =>
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

    setShowAnswer(true);
  }, [currentQuestion, currentIndex, inputValue, strictMode, awardXP]);

  const handleSkip = useCallback(() => {
    if (!currentQuestion) return;

    setQuestions((prev) =>
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
    setShowAnswer(true);
  }, [currentQuestion, currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setInputValue("");
      setShowAnswer(false);
    } else {
      // Check if there are incorrect answers to review
      const incorrectQuestions = questions.filter(
        (q) => q.isCorrect === false && !q.skipped
      );
      if (incorrectQuestions.length > 0 && phase === "studying") {
        setPhase("review");
        // Reset for review
        setQuestions((prev) =>
          prev
            .filter((q) => q.isCorrect === false && !q.skipped)
            .map((q) => ({ ...q, isCorrect: null, feedback: "", userAnswer: "" }))
        );
        setCurrentIndex(0);
        setInputValue("");
        setShowAnswer(false);
      } else {
        // Complete
        setPhase("complete");
        const durationSeconds = Math.floor(
          (Date.now() - sessionStartTime.current) / 1000
        );
        const isPerfect = stats.incorrect === 0 && stats.skipped === 0;
        recordSessionComplete({
          cardsStudied: stats.total,
          isPerfectScore: isPerfect,
          durationSeconds,
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
    setQuestions(
      shuffled.map((card) => ({
        card,
        userAnswer: "",
        isCorrect: null,
        feedback: "",
        skipped: false,
      }))
    );
    setCurrentIndex(0);
    setPhase("studying");
    setInputValue("");
    setShowAnswer(false);
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
              onClick={() => setShowSettings(!showSettings)}
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
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={strictMode}
                onChange={(e) => setStrictMode(e.target.checked)}
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
            <label className="text-sm text-muted-foreground mb-2 block">
              Type the definition
            </label>
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
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
