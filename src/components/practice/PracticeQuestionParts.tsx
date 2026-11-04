"use client";

import { CheckCheck, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Question } from "@/types/question";
import { ExplainMistakeButton } from "./ExplainMistakeButton";
import { StreamingQuestionGenerator } from "./StreamingQuestionGenerator";
import { AnswerFeedback } from "./AnswerFeedback";

function mistakeUserAnswer(selectedAnswer: string | undefined): string {
  return selectedAnswer ?? "";
}

function MistakeExplanation({
  isCorrect,
  question,
  selectedAnswer,
  sectionId,
}: {
  isCorrect: boolean;
  question: Question;
  selectedAnswer: string | undefined;
  sectionId: string;
}) {
  if (isCorrect) return null;
  return (
    <ExplainMistakeButton
      question={question.text}
      userAnswer={mistakeUserAnswer(selectedAnswer)}
      correctAnswer={question.correctAnswer}
      sectionId={sectionId}
    />
  );
}

export function QuestionFeedback({
  showFeedback,
  isCorrect,
  question,
  selectedAnswer,
  sectionId,
}: {
  showFeedback: boolean;
  isCorrect: boolean | null;
  question: Question;
  selectedAnswer: string | undefined;
  sectionId: string;
}) {
  if (!showFeedback || isCorrect === null) return null;
  return (
    <AnswerFeedback
      isCorrect={isCorrect}
      explanation={question.explanation}
      correctAnswer={question.correctAnswer}
    >
      <MistakeExplanation
        isCorrect={isCorrect}
        question={question}
        selectedAnswer={selectedAnswer}
        sectionId={sectionId}
      />
    </AnswerFeedback>
  );
}

function generatorPassage(readingPassage: string | null): string | undefined {
  return readingPassage ?? undefined;
}

export function GeneratedQuestionSlot({
  isLastQuestion,
  sectionId,
  readingPassage,
  suggestedDifficulty,
  onGeneratedQuestion,
}: {
  isLastQuestion: boolean;
  sectionId: string;
  readingPassage: string | null;
  suggestedDifficulty: string;
  onGeneratedQuestion: (question: Question) => void;
}) {
  if (!isLastQuestion) return null;
  return (
    <StreamingQuestionGenerator
      sectionId={sectionId}
      readingPassage={generatorPassage(readingPassage)}
      onQuestion={onGeneratedQuestion}
      difficulty={suggestedDifficulty}
    />
  );
}

function CheckAnswerButton({ onCheck }: { onCheck: () => void }) {
  return (
    <Button type="button" onClick={onCheck}>
      <CheckCheck aria-hidden />
      Check answer
    </Button>
  );
}

function submitButtonVariant(canCheck: boolean): "outline" | "default" {
  if (canCheck) return "outline";
  return "default";
}

function submitButtonLabel(isSubmitting: boolean): string {
  if (isSubmitting) return "Submitting...";
  return "Submit";
}

function SubmitAnswerButton({
  canCheck,
  isSubmitting,
  onSubmit,
}: {
  canCheck: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
}) {
  return (
    <Button
      type="button"
      variant={submitButtonVariant(canCheck)}
      onClick={onSubmit}
      isLoading={isSubmitting}
    >
      <SubmitIcon isSubmitting={isSubmitting} />
      {submitButtonLabel(isSubmitting)}
    </Button>
  );
}

function SubmitIcon({ isSubmitting }: { isSubmitting: boolean }) {
  if (isSubmitting) return null;
  return <Send aria-hidden />;
}

export function PracticeQuestionActions({
  canCheck,
  allAnswered,
  isSubmitting,
  onCheck,
  onSubmit,
}: {
  canCheck: boolean;
  allAnswered: boolean;
  isSubmitting: boolean;
  onCheck: () => void;
  onSubmit: () => void;
}) {
  return (
    <>
      <CheckAnswerAction canCheck={canCheck} onCheck={onCheck} />
      <SubmitAnswerAction
        allAnswered={allAnswered}
        canCheck={canCheck}
        isSubmitting={isSubmitting}
        onSubmit={onSubmit}
      />
    </>
  );
}

function CheckAnswerAction({
  canCheck,
  onCheck,
}: {
  canCheck: boolean;
  onCheck: () => void;
}) {
  if (!canCheck) return null;
  return <CheckAnswerButton onCheck={onCheck} />;
}

function SubmitAnswerAction({
  allAnswered,
  canCheck,
  isSubmitting,
  onSubmit,
}: {
  allAnswered: boolean;
  canCheck: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
}) {
  if (!allAnswered) return null;
  return (
    <SubmitAnswerButton
      canCheck={canCheck}
      isSubmitting={isSubmitting}
      onSubmit={onSubmit}
    />
  );
}
