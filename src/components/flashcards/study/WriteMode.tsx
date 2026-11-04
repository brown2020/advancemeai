"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type RefObject } from "react";
import { ArrowRight, Eye, PartyPopper, PenLine, Settings2 } from "lucide-react";
import type { Flashcard } from "@/types/flashcard";
import type { XPEventType } from "@/types/gamification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/utils/cn";
import { isAnswerCorrect } from "./answer-matching";
import { useGamification } from "@/hooks/useGamification";
import { shuffle } from "@/utils/random";
import { formatDuration, secondsSince } from "./study-utils";
import { percent } from "@/utils/format";
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

type WriteStats = {
  correct: number;
  incorrect: number;
  skipped: number;
  total: number;
};

type Rewards = { xp: number; level: number; streak: number };

function buildQuestions(cards: Flashcard[]): WriteQuestion[] {
  return shuffle(cards).map((card) => ({
    card,
    userAnswer: "",
    isCorrect: null,
    feedback: "",
    skipped: false,
  }));
}

function writeStats(questions: readonly WriteQuestion[]): WriteStats {
  let correct = 0;
  let incorrect = 0;
  let skipped = 0;
  for (const question of questions) {
    if (question.isCorrect === true) correct += 1;
    if (question.isCorrect === false) incorrect += 1;
    if (question.skipped) skipped += 1;
  }
  return { correct, incorrect, skipped, total: questions.length };
}

function hasReviewableMistakes(questions: readonly WriteQuestion[]): boolean {
  for (const question of questions) {
    if (question.isCorrect === false && !question.skipped) return true;
  }
  return false;
}

function updateQuestion(
  questions: readonly WriteQuestion[],
  index: number,
  patch: (question: WriteQuestion) => WriteQuestion,
): WriteQuestion[] {
  const next: WriteQuestion[] = [];
  for (const [entryIndex, question] of questions.entries()) {
    if (entryIndex === index) next.push(patch(question));
    else next.push(question);
  }
  return next;
}

function mistakesToReview(questions: readonly WriteQuestion[]): WriteQuestion[] {
  const next: WriteQuestion[] = [];
  for (const question of questions) {
    if (question.isCorrect === false && !question.skipped) {
      next.push({ ...question, isCorrect: null, feedback: "", userAnswer: "" });
    }
  }
  return next;
}

function writeResultTitle(isPerfect: boolean, accuracy: number): string {
  if (isPerfect) return "Perfect!";
  if (accuracy >= 70) return "Great job!";
  return "Keep practicing!";
}

function writeNextLabel(isLast: boolean, phase: Phase, hasMistakes: boolean): string {
  if (!isLast) return "Next";
  if (phase === "studying" && hasMistakes) return "Review mistakes";
  return "Finish";
}

function writeProgress(currentIndex: number, showAnswer: boolean, total: number): number {
  const completed = showAnswer ? 1 : 0;
  return percent(currentIndex + completed, total);
}

function writeAnswerClassName(showAnswer: boolean, isCorrect: boolean | null): string {
  return cn(
    "h-14 text-base",
    showAnswer && isCorrect && "border-success",
    showAnswer && !isCorrect && "border-destructive",
  );
}

function writeAnswerInvalid(showAnswer: boolean, isCorrect: boolean | null): true | undefined {
  if (showAnswer && !isCorrect) return true;
  return undefined;
}

function feedbackCorrectness(showAnswer: boolean, isCorrect: boolean | null): boolean | null {
  if (!showAnswer) return null;
  return Boolean(isCorrect);
}

function feedbackTitle(feedback: string): string | undefined {
  if (feedback) return feedback;
  return undefined;
}

function showCorrectAnswer(showAnswer: boolean, isCorrect: boolean | null): boolean {
  return Boolean(showAnswer && !isCorrect);
}

function canCheckWriteAnswer(showAnswer: boolean, inputValue: string): boolean {
  return !showAnswer && Boolean(inputValue.trim());
}

function onWriteFormSubmit(
  event: FormEvent<HTMLFormElement>,
  showAnswer: boolean,
  inputValue: string,
  onCheck: () => void,
) {
  event.preventDefault();
  if (canCheckWriteAnswer(showAnswer, inputValue)) onCheck();
}

function focusWriteField(
  phase: Phase,
  showAnswer: boolean,
  input: HTMLInputElement | null,
  next: HTMLButtonElement | null,
) {
  if (phase === "complete") return;
  if (showAnswer) next?.focus();
  else input?.focus();
}

function applyCheckedAnswer(
  questions: readonly WriteQuestion[],
  index: number,
  userAnswer: string,
  isCorrect: boolean,
  feedback: string,
): WriteQuestion[] {
  return updateQuestion(questions, index, (question) => ({
    ...question,
    userAnswer,
    isCorrect,
    feedback,
  }));
}

function applySkippedAnswer(questions: readonly WriteQuestion[], index: number): WriteQuestion[] {
  return updateQuestion(questions, index, (question) => ({
    ...question,
    skipped: true,
    isCorrect: false,
    feedback: `Skipped. The answer was: ${question.card.definition}`,
  }));
}

function awardIfCorrect(isCorrect: boolean, awardXP: (eventType: XPEventType) => void) {
  if (isCorrect) awardXP("card-studied");
}

type WriteModeProps = {
  cards: Flashcard[];
  flashcardSetId?: string;
};

function WriteCompleteView({
  stats,
  durationSeconds,
  rewards,
  onStudyAgain,
}: {
  stats: WriteStats;
  durationSeconds: number;
  rewards: Rewards;
  onStudyAgain: () => void;
}) {
  const accuracy = percent(stats.correct, stats.total);
  const isPerfect = stats.incorrect === 0 && stats.skipped === 0;

  return (
    <div className="space-y-4">
      <StudyTopBar progress={100} />
      <StudyResults
        icon={isPerfect ? PartyPopper : PenLine}
        title={writeResultTitle(isPerfect, accuracy)}
        message={`Accuracy: ${accuracy}%`}
        stats={[
          { label: "Correct", value: stats.correct, tone: "success" },
          { label: "Incorrect", value: stats.incorrect, tone: "destructive" },
          { label: "Skipped", value: stats.skipped },
          { label: "Time", value: formatDuration(durationSeconds) },
        ]}
        rewards={rewards}
        onStudyAgain={onStudyAgain}
      />
    </div>
  );
}

function WriteReviewBanner({ phase }: { phase: Phase }) {
  if (phase !== "review") return null;
  return (
    <p className="rounded-xl bg-warning/10 px-4 py-2 text-sm font-medium text-warning">
      Reviewing mistakes: give these another try.
    </p>
  );
}

function WriteCorrectAnswer({ definition }: { definition: string }) {
  return (
    <>
      <span className="text-muted-foreground">Correct answer: </span>
      <span className="font-medium">{definition}</span>
    </>
  );
}

function WriteActions({
  showAnswer,
  inputValue,
  nextLabel,
  nextRef,
  onSkip,
  onNext,
}: {
  showAnswer: boolean;
  inputValue: string;
  nextLabel: string;
  nextRef: RefObject<HTMLButtonElement | null>;
  onSkip: () => void;
  onNext: () => void;
}) {
  if (showAnswer) {
    return (
      <Button ref={nextRef} type="button" size="lg" onClick={onNext}>
        {nextLabel}
        <ArrowRight aria-hidden />
      </Button>
    );
  }

  return (
    <>
      <Button type="button" variant="ghost" size="lg" onClick={onSkip}>
        <Eye aria-hidden />
        Don&apos;t know
      </Button>
      <Button type="submit" size="lg" disabled={!inputValue.trim()}>
        Check
      </Button>
    </>
  );
}

function WriteQuestionView({
  question,
  currentIndex,
  questionCount,
  phase,
  inputValue,
  showAnswer,
  strictMode,
  hasMistakes,
  inputRef,
  nextRef,
  onInputChange,
  onStrictMode,
  onCheck,
  onSkip,
  onNext,
}: {
  question: WriteQuestion;
  currentIndex: number;
  questionCount: number;
  phase: Phase;
  inputValue: string;
  showAnswer: boolean;
  strictMode: boolean;
  hasMistakes: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  nextRef: RefObject<HTMLButtonElement | null>;
  onInputChange: (value: string) => void;
  onStrictMode: (checked: boolean) => void;
  onCheck: () => void;
  onSkip: () => void;
  onNext: () => void;
}) {
  const isLast = currentIndex >= questionCount - 1;
  const nextLabel = writeNextLabel(isLast, phase, hasMistakes);
  const revealAnswer = showCorrectAnswer(showAnswer, question.isCorrect);

  return (
    <div className="space-y-4">
      <StudyTopBar
        progress={writeProgress(currentIndex, showAnswer, questionCount)}
        progressLabel={`${currentIndex + 1} / ${questionCount}`}
        actions={
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="icon" aria-label="Write settings">
                <Settings2 />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72">
              <SettingSwitch
                id="write-strict-mode"
                label="Strict mode"
                description="Exact match only, no typo tolerance."
                checked={strictMode}
                onCheckedChange={onStrictMode}
              />
            </PopoverContent>
          </Popover>
        }
      />

      <WriteReviewBanner phase={phase} />

      <StudyPromptCard label="Term" imageUrl={question.card.termImageUrl}>
        {question.card.term}
      </StudyPromptCard>

      <form
        className="space-y-4"
        onSubmit={(event) => onWriteFormSubmit(event, showAnswer, inputValue, onCheck)}
      >
        <div>
          <label htmlFor="write-answer" className="mb-2 block text-sm font-semibold text-muted-foreground">
            Type the definition
          </label>
          <Input
            id="write-answer"
            ref={inputRef}
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder="Your answer"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            disabled={showAnswer}
            aria-invalid={writeAnswerInvalid(showAnswer, question.isCorrect)}
            className={writeAnswerClassName(showAnswer, question.isCorrect)}
          />
        </div>

        <StudyFeedback
          isCorrect={feedbackCorrectness(showAnswer, question.isCorrect)}
          title={feedbackTitle(question.feedback)}
        >
          {revealAnswer ? <WriteCorrectAnswer definition={question.card.definition} /> : null}
        </StudyFeedback>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <WriteActions
            showAnswer={showAnswer}
            inputValue={inputValue}
            nextLabel={nextLabel}
            nextRef={nextRef}
            onSkip={onSkip}
            onNext={onNext}
          />
        </div>
      </form>
    </div>
  );
}

export function WriteMode({ cards, flashcardSetId }: WriteModeProps) {
  const [questions, setQuestions] = useState<WriteQuestion[]>(() => buildQuestions(cards));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("studying");
  const [inputValue, setInputValue] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [strictMode, setStrictMode] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);

  const { xp, level, currentStreak, recordSessionComplete, awardXP } = useGamification();
  const sessionStartTime = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    sessionStartTime.current = Date.now();
  }, []);

  // Focus the input for each new question, and "Next" once answered.
  useEffect(() => {
    focusWriteField(phase, showAnswer, inputRef.current, nextRef.current);
  }, [currentIndex, phase, showAnswer]);

  const currentQuestion = questions[currentIndex];
  const stats = useMemo(() => writeStats(questions), [questions]);
  const hasMistakes = hasReviewableMistakes(questions);
  const rewards = { xp, level, streak: currentStreak };

  const handleSubmit = () => {
    if (!currentQuestion || currentQuestion.isCorrect !== null) return;
    const result = isAnswerCorrect(inputValue, currentQuestion.card.definition, { strictMode });
    setQuestions((prev) =>
      applyCheckedAnswer(prev, currentIndex, inputValue, result.isCorrect, result.feedback),
    );
    awardIfCorrect(result.isCorrect, awardXP);
    setShowAnswer(true);
  };

  const handleSkip = () => {
    if (!currentQuestion) return;
    setQuestions((prev) => applySkippedAnswer(prev, currentIndex));
    setShowAnswer(true);
  };

  const finishSession = () => {
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

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setInputValue("");
      setShowAnswer(false);
      return;
    }

    // Second pass over the answers that were wrong (not skipped).
    if (hasMistakes && phase === "studying") {
      setPhase("review");
      setQuestions((prev) => mistakesToReview(prev));
      setCurrentIndex(0);
      setInputValue("");
      setShowAnswer(false);
      return;
    }

    finishSession();
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
    return (
      <WriteCompleteView
        stats={stats}
        durationSeconds={durationSeconds}
        rewards={rewards}
        onStudyAgain={restartStudy}
      />
    );
  }

  if (!currentQuestion) return null;

  return (
    <WriteQuestionView
      question={currentQuestion}
      currentIndex={currentIndex}
      questionCount={questions.length}
      phase={phase}
      inputValue={inputValue}
      showAnswer={showAnswer}
      strictMode={strictMode}
      hasMistakes={hasMistakes}
      inputRef={inputRef}
      nextRef={nextRef}
      onInputChange={setInputValue}
      onStrictMode={setStrictMode}
      onCheck={handleSubmit}
      onSkip={handleSkip}
      onNext={handleNext}
    />
  );
}
