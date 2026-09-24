"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Eye, PartyPopper, PenLine, Settings2 } from "lucide-react";
import type { Flashcard } from "@/types/flashcard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/utils/cn";
import { isAnswerCorrect } from "@/lib/utils/answerMatching";
import { useGamification } from "@/hooks/useGamification";
import { shuffle } from "@/utils/random";
import { formatDuration, percent, secondsSince } from "./study-utils";
import { SettingSwitch } from "./SettingSwitch";
import { StudyFeedback } from "./StudyFeedback";
import { StudyPromptCard } from "./StudyPromptCard";
import { StudyResults } from "./StudyResults";
import { StudyTopBar } from "./StudyTopBar";

type WriteQuestion = {
  card: Flashcard;
  userAnswer: string;
  isCorrect: boolean | null;
  feedback: string;
  skipped: boolean;
};

type Phase = "studying" | "review" | "complete";

function buildQuestions(cards: Flashcard[]): WriteQuestion[] {
  return shuffle(cards).map((card) => ({
    card,
    userAnswer: "",
    isCorrect: null,
    feedback: "",
    skipped: false,
  }));
}

type WriteModeProps = {
  cards: Flashcard[];
  flashcardSetId?: string;
};

export function WriteMode({ cards, flashcardSetId }: WriteModeProps) {
  const [questions, setQuestions] = useState<WriteQuestion[]>(() => buildQuestions(cards));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("studying");
  const [inputValue, setInputValue] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [strictMode, setStrictMode] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);

  const { xp, level, currentStreak, recordSessionComplete, awardXP } =
    useGamification();
  const sessionStartTime = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    sessionStartTime.current = Date.now();
  }, []);

  // Focus the input for each new question, and "Next" once answered.
  useEffect(() => {
    if (phase === "complete") return;
    if (showAnswer) nextRef.current?.focus();
    else inputRef.current?.focus();
  }, [currentIndex, phase, showAnswer]);

  const currentQuestion = questions[currentIndex];

  const stats = useMemo(() => {
    const correct = questions.filter((q) => q.isCorrect === true).length;
    const incorrect = questions.filter((q) => q.isCorrect === false).length;
    const skipped = questions.filter((q) => q.skipped).length;
    return { correct, incorrect, skipped, total: questions.length };
  }, [questions]);

  const hasMistakesToReview = questions.some((q) => q.isCorrect === false && !q.skipped);

  const handleSubmit = () => {
    if (!currentQuestion || currentQuestion.isCorrect !== null) return;
    const result = isAnswerCorrect(inputValue, currentQuestion.card.definition, {
      strictMode,
    });

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
    if (result.isCorrect) awardXP("card-studied");
    setShowAnswer(true);
  };

  const handleSkip = () => {
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
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setInputValue("");
      setShowAnswer(false);
      return;
    }

    if (hasMistakesToReview && phase === "studying") {
      // Second pass over the answers that were wrong (not skipped).
      setPhase("review");
      setQuestions((prev) =>
        prev
          .filter((q) => q.isCorrect === false && !q.skipped)
          .map((q) => ({ ...q, isCorrect: null, feedback: "", userAnswer: "" }))
      );
      setCurrentIndex(0);
      setInputValue("");
      setShowAnswer(false);
      return;
    }

    setPhase("complete");
    const duration = secondsSince(sessionStartTime.current);
    setDurationSeconds(duration);
    void recordSessionComplete({
      cardsStudied: stats.total,
      isPerfectScore: stats.incorrect === 0 && stats.skipped === 0,
      durationSeconds: duration,
      flashcardSetId,
    });
  };

  const restartStudy = () => {
    setQuestions(buildQuestions(cards));
    setCurrentIndex(0);
    setPhase("studying");
    setInputValue("");
    setShowAnswer(false);
    sessionStartTime.current = Date.now();
  };

  if (!cards.length) return null;

  if (phase === "complete") {
    const accuracy = percent(stats.correct, stats.total);
    const isPerfect = stats.incorrect === 0 && stats.skipped === 0;

    return (
      <div className="space-y-4">
        <StudyTopBar progress={100} />
        <StudyResults
          icon={isPerfect ? PartyPopper : PenLine}
          title={isPerfect ? "Perfect!" : accuracy >= 70 ? "Great job!" : "Keep practicing!"}
          message={`Accuracy: ${accuracy}%`}
          stats={[
            { label: "Correct", value: stats.correct, tone: "success" },
            { label: "Incorrect", value: stats.incorrect, tone: "destructive" },
            { label: "Skipped", value: stats.skipped },
            { label: "Time", value: formatDuration(durationSeconds) },
          ]}
          rewards={{ xp, level, streak: currentStreak }}
          onStudyAgain={restartStudy}
        />
      </div>
    );
  }

  if (!currentQuestion) return null;

  const isLast = currentIndex >= questions.length - 1;
  const nextLabel = !isLast
    ? "Next"
    : phase === "studying" && hasMistakesToReview
      ? "Review mistakes"
      : "Finish";

  return (
    <div className="space-y-4">
      <StudyTopBar
        progress={percent(currentIndex + (showAnswer ? 1 : 0), questions.length)}
        progressLabel={`${currentIndex + 1} / ${questions.length}`}
        actions={
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Write settings"
              >
                <Settings2 />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72">
              <SettingSwitch
                id="write-strict-mode"
                label="Strict mode"
                description="Exact match only, no typo tolerance."
                checked={strictMode}
                onCheckedChange={setStrictMode}
              />
            </PopoverContent>
          </Popover>
        }
      />

      {phase === "review" ? (
        <p className="rounded-xl bg-warning/10 px-4 py-2 text-sm font-medium text-warning">
          Reviewing mistakes: give these another try.
        </p>
      ) : null}

      <StudyPromptCard label="Term" imageUrl={currentQuestion.card.termImageUrl}>
        {currentQuestion.card.term}
      </StudyPromptCard>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!showAnswer && inputValue.trim()) handleSubmit();
        }}
      >
        <div>
          <label
            htmlFor="write-answer"
            className="mb-2 block text-sm font-semibold text-muted-foreground"
          >
            Type the definition
          </label>
          <Input
            id="write-answer"
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Your answer"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            disabled={showAnswer}
            aria-invalid={showAnswer && !currentQuestion.isCorrect ? true : undefined}
            className={cn(
              "h-14 text-base",
              showAnswer && currentQuestion.isCorrect && "border-success",
              showAnswer && !currentQuestion.isCorrect && "border-destructive"
            )}
          />
        </div>

        <StudyFeedback
          isCorrect={showAnswer ? Boolean(currentQuestion.isCorrect) : null}
          title={currentQuestion.feedback || undefined}
        >
          {showAnswer && !currentQuestion.isCorrect ? (
            <>
              <span className="text-muted-foreground">Correct answer: </span>
              <span className="font-medium">{currentQuestion.card.definition}</span>
            </>
          ) : null}
        </StudyFeedback>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {!showAnswer ? (
            <>
              <Button type="button" variant="ghost" size="lg" onClick={handleSkip}>
                <Eye aria-hidden />
                Don&apos;t know
              </Button>
              <Button type="submit" size="lg" disabled={!inputValue.trim()}>
                Check
              </Button>
            </>
          ) : (
            <Button ref={nextRef} type="button" size="lg" onClick={handleNext}>
              {nextLabel}
              <ArrowRight aria-hidden />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
