"use client";

import { CheckCheck, Send } from "lucide-react";
import type { Question } from "@/types/question";
import { Button } from "@/components/ui/button";
import { TestTopBar } from "@/components/practice/TestTopBar";
import { TestBottomBar } from "@/components/practice/TestBottomBar";
import { QuestionView } from "@/components/practice/QuestionView";
import { AnswerChoices } from "@/components/practice/AnswerChoices";
import { AnswerFeedback } from "@/components/practice/AnswerFeedback";
import { QuestionNavigator } from "@/components/practice/QuestionNavigator";

function canSubmitSection(
  hasAllQuestions: boolean,
  answeredCount: number,
  totalQuestionsTarget: number,
  remainingSeconds: number | null,
): boolean {
  if (remainingSeconds === 0) return true;
  return hasAllQuestions && answeredCount === totalQuestionsTarget;
}

function submitLabel(isSubmitting: boolean, isLastSection: boolean): string {
  if (isSubmitting) return "Submitting...";
  if (isLastSection) return "Finish test";
  return "Submit section";
}

function passageForSection(sectionId: string | undefined, readingPassage: string | null): string | null {
  if (sectionId === "reading-writing") return readingPassage;
  return null;
}

function SectionFeedback({
  showFeedback,
  isCorrect,
  explanation,
  correctAnswer,
}: {
  showFeedback: boolean;
  isCorrect: boolean | null;
  explanation: string;
  correctAnswer: string;
}) {
  if (!showFeedback || isCorrect === null) return null;
  return (
    <AnswerFeedback
      isCorrect={isCorrect}
      explanation={explanation}
      correctAnswer={correctAnswer}
    />
  );
}

function CheckAnswerButton({
  canSubmit,
  onCheck,
}: {
  canSubmit: boolean;
  onCheck: () => void;
}) {
  return (
    <Button type="button" variant={canSubmit ? "outline" : "default"} onClick={onCheck}>
      <CheckCheck aria-hidden />
      Check answer
    </Button>
  );
}

function SubmitSectionButton({
  isSubmitting,
  isLastSection,
  onSubmit,
}: {
  isSubmitting: boolean;
  isLastSection: boolean;
  onSubmit: () => void;
}) {
  return (
    <Button type="button" onClick={onSubmit} isLoading={isSubmitting}>
      {isSubmitting ? null : <Send aria-hidden />}
      {submitLabel(isSubmitting, isLastSection)}
    </Button>
  );
}

function FullTestActions({
  showFeedback,
  selectedAnswer,
  hasAllQuestions,
  answeredCount,
  totalQuestionsTarget,
  remainingSeconds,
  isSubmitting,
  isLastSection,
  onCheck,
  onSubmit,
}: {
  showFeedback: boolean;
  selectedAnswer: string | undefined;
  hasAllQuestions: boolean;
  answeredCount: number;
  totalQuestionsTarget: number;
  remainingSeconds: number | null;
  isSubmitting: boolean;
  isLastSection: boolean;
  onCheck: () => void;
  onSubmit: () => void;
}) {
  const canSubmit = canSubmitSection(
    hasAllQuestions,
    answeredCount,
    totalQuestionsTarget,
    remainingSeconds,
  );
  const canCheck = !showFeedback && Boolean(selectedAnswer);
  return (
    <>
      {canCheck ? <CheckAnswerButton canSubmit={canSubmit} onCheck={onCheck} /> : null}
      {canSubmit ? (
        <SubmitSectionButton
          isSubmitting={isSubmitting}
          isLastSection={isLastSection}
          onSubmit={onSubmit}
        />
      ) : null}
    </>
  );
}

export function FullTestScreen({
  sectionIndex,
  sectionCount,
  sectionTitle,
  sectionId,
  totalQuestionsTarget,
  currentQuestionIndex,
  currentQuestion,
  readingPassage,
  selectedAnswer,
  selectedAnswers,
  questions,
  showFeedback,
  isCorrect,
  remainingSeconds,
  isSubmitting,
  onSelect,
  onJump,
  onCheck,
  onSubmit,
}: {
  sectionIndex: number;
  sectionCount: number;
  sectionTitle: string;
  sectionId: string | undefined;
  totalQuestionsTarget: number;
  currentQuestionIndex: number;
  currentQuestion: Question;
  readingPassage: string | null;
  selectedAnswer: string | undefined;
  selectedAnswers: Record<string, string>;
  questions: Question[];
  showFeedback: boolean;
  isCorrect: boolean | null;
  remainingSeconds: number | null;
  isSubmitting: boolean;
  onSelect: (value: string) => void;
  onJump: (index: number) => void;
  onCheck: () => void;
  onSubmit: () => void;
}) {
  const answeredCount = Object.keys(selectedAnswers).length;
  const hasAllQuestions = questions.length >= totalQuestionsTarget;
  return (
    <div className="flex min-h-[calc(100svh-4rem)] flex-col">
      <TestTopBar
        eyebrow={`Section ${sectionIndex + 1} of ${sectionCount}`}
        title={sectionTitle}
        current={currentQuestionIndex + 1}
        total={totalQuestionsTarget}
        remainingSeconds={remainingSeconds}
        confirmExit
      />

      <main className="flex-1">
        <QuestionView
          questionNumber={currentQuestionIndex + 1}
          questionText={currentQuestion.text}
          passage={passageForSection(sectionId, readingPassage)}
        >
          <AnswerChoices
            options={currentQuestion.options}
            selected={selectedAnswer}
            onSelect={onSelect}
            revealed={showFeedback}
            correctAnswer={currentQuestion.correctAnswer}
          />
          <SectionFeedback
            showFeedback={showFeedback}
            isCorrect={isCorrect}
            explanation={currentQuestion.explanation ?? ""}
            correctAnswer={currentQuestion.correctAnswer}
          />
          <p className="text-sm tabular-nums text-muted-foreground md:hidden">
            {answeredCount} of {totalQuestionsTarget} answered
          </p>
        </QuestionView>
      </main>

      <TestBottomBar
        onBack={() => onJump(currentQuestionIndex - 1)}
        onNext={() => onJump(currentQuestionIndex + 1)}
        canGoBack={currentQuestionIndex > 0}
        canGoNext={currentQuestionIndex < questions.length - 1}
        status={
          <QuestionNavigator
            total={totalQuestionsTarget}
            currentIndex={currentQuestionIndex}
            available={questions.length}
            isAnswered={(index) => {
              const question = questions[index];
              return Boolean(question && selectedAnswers[question.id]);
            }}
            onJump={onJump}
          />
        }
      >
        <FullTestActions
          showFeedback={showFeedback}
          selectedAnswer={selectedAnswer}
          hasAllQuestions={hasAllQuestions}
          answeredCount={answeredCount}
          totalQuestionsTarget={totalQuestionsTarget}
          remainingSeconds={remainingSeconds}
          isSubmitting={isSubmitting}
          isLastSection={sectionIndex === sectionCount - 1}
          onCheck={onCheck}
          onSubmit={onSubmit}
        />
      </TestBottomBar>
    </div>
  );
}
