"use client";

import { CheckCheck, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Question } from "@/types/question";
import type { PracticeMode } from "@/api/firebase/practiceProgressRepository";
import { ExplainMistakeButton } from "./ExplainMistakeButton";
import { BookmarkQuestionButton } from "./BookmarkQuestionButton";
import { StreamingQuestionGenerator } from "./StreamingQuestionGenerator";
import { MicroLessonTip } from "./PracticeComponents";
import { TestTopBar } from "./TestTopBar";
import { TestBottomBar } from "./TestBottomBar";
import { QuestionView } from "./QuestionView";
import { AnswerChoices } from "./AnswerChoices";
import { AnswerFeedback } from "./AnswerFeedback";

const MODE_LABELS: Record<PracticeMode, string> = {
  timed: "Timed practice",
  review: "Review practice",
  micro: "Micro lesson",
};

type PracticeQuestionScreenProps = {
  sectionId: string;
  sectionTitle: string;
  practiceMode: PracticeMode;
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  remainingSeconds: number | null;
  readingPassage: string | null;
  microLessonTip: string | null;
  selectedAnswer: string | undefined;
  showFeedback: boolean;
  isCorrect: boolean | null;
  answeredCount: number;
  score: number;
  isSubmitting: boolean;
  suggestedDifficulty: string;
  onSelect: (option: string) => void;
  onBack: () => void;
  onNext: () => void;
  onCheck: () => void;
  onSubmit: () => void;
  onGeneratedQuestion: (question: Question) => void;
};

/** Active question screen for section practice (top bar, question, nav). */
export function PracticeQuestionScreen({
  sectionId,
  sectionTitle,
  practiceMode,
  question,
  questionIndex,
  totalQuestions,
  remainingSeconds,
  readingPassage,
  microLessonTip,
  selectedAnswer,
  showFeedback,
  isCorrect,
  answeredCount,
  score,
  isSubmitting,
  suggestedDifficulty,
  onSelect,
  onBack,
  onNext,
  onCheck,
  onSubmit,
  onGeneratedQuestion,
}: PracticeQuestionScreenProps) {
  const isLastQuestion = questionIndex === totalQuestions - 1;
  const allAnswered = answeredCount === totalQuestions;
  const canCheck = !showFeedback && Boolean(selectedAnswer);

  return (
    <div className="flex min-h-[calc(100svh-4rem)] flex-col">
      <TestTopBar
        title={sectionTitle}
        eyebrow={MODE_LABELS[practiceMode]}
        current={questionIndex + 1}
        total={totalQuestions}
        remainingSeconds={practiceMode === "timed" ? remainingSeconds : null}
        actions={
          <BookmarkQuestionButton
            questionId={question.id}
            questionText={question.text}
            correctAnswer={question.correctAnswer}
            sectionId={sectionId}
          />
        }
      />

      <main className="flex-1">
        <QuestionView
          questionNumber={questionIndex + 1}
          questionText={question.text}
          passage={sectionId === "reading" ? readingPassage : null}
          preface={
            practiceMode === "micro" ? (
              <MicroLessonTip tip={microLessonTip} />
            ) : undefined
          }
        >
          <AnswerChoices
            options={question.options}
            selected={selectedAnswer}
            onSelect={onSelect}
            revealed={showFeedback}
            correctAnswer={question.correctAnswer}
          />

          {showFeedback && isCorrect !== null && (
            <AnswerFeedback
              isCorrect={isCorrect}
              explanation={question.explanation}
              correctAnswer={question.correctAnswer}
            >
              {!isCorrect && (
                <ExplainMistakeButton
                  question={question.text}
                  userAnswer={selectedAnswer ?? ""}
                  correctAnswer={question.correctAnswer}
                  sectionId={sectionId}
                />
              )}
            </AnswerFeedback>
          )}

          {isLastQuestion && (
            <StreamingQuestionGenerator
              sectionId={sectionId}
              readingPassage={readingPassage ?? undefined}
              onQuestion={onGeneratedQuestion}
              difficulty={suggestedDifficulty}
            />
          )}
        </QuestionView>
      </main>

      <TestBottomBar
        onBack={onBack}
        onNext={onNext}
        canGoBack={questionIndex > 0}
        canGoNext={!isLastQuestion}
        status={
          <>
            {answeredCount} of {totalQuestions} answered · {score} correct
          </>
        }
      >
        {canCheck && (
          <Button type="button" onClick={onCheck}>
            <CheckCheck aria-hidden />
            Check answer
          </Button>
        )}
        {allAnswered && (
          <Button
            type="button"
            variant={canCheck ? "outline" : "default"}
            onClick={onSubmit}
            isLoading={isSubmitting}
          >
            {!isSubmitting && <Send aria-hidden />}
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        )}
      </TestBottomBar>
    </div>
  );
}
