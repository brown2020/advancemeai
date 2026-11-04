"use client";

import type { Question } from "@/types/question";
import type { PracticeMode } from "@/api/firebase/practiceProgressRepository";
import { BookmarkQuestionButton } from "./BookmarkQuestionButton";
import { TestTopBar } from "./TestTopBar";
import { TestBottomBar } from "./TestBottomBar";
import { QuestionView } from "./QuestionView";
import { AnswerChoices } from "./AnswerChoices";
import { MicroLessonTip } from "./PracticeComponents";
import {
  GeneratedQuestionSlot,
  PracticeQuestionActions,
  QuestionFeedback,
} from "./PracticeQuestionParts";
import {
  answerCanBeChecked,
  passageForSection,
  timedRemaining,
} from "./practice-question-helpers";

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
  const canCheck = answerCanBeChecked(showFeedback, selectedAnswer);

  return (
    <div className="flex min-h-[calc(100svh-4rem)] flex-col">
      <TestTopBar
        title={sectionTitle}
        eyebrow={MODE_LABELS[practiceMode]}
        current={questionIndex + 1}
        total={totalQuestions}
        remainingSeconds={timedRemaining(practiceMode, remainingSeconds)}
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
          passage={passageForSection(sectionId, readingPassage)}
          preface={practiceMode === "micro" ? <MicroLessonTip tip={microLessonTip} /> : undefined}
        >
          <AnswerChoices
            options={question.options}
            selected={selectedAnswer}
            onSelect={onSelect}
            revealed={showFeedback}
            correctAnswer={question.correctAnswer}
          />
          <QuestionFeedback
            showFeedback={showFeedback}
            isCorrect={isCorrect}
            question={question}
            selectedAnswer={selectedAnswer}
            sectionId={sectionId}
          />
          <GeneratedQuestionSlot
            isLastQuestion={isLastQuestion}
            sectionId={sectionId}
            readingPassage={readingPassage}
            suggestedDifficulty={suggestedDifficulty}
            onGeneratedQuestion={onGeneratedQuestion}
          />
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
        <PracticeQuestionActions
          canCheck={canCheck}
          allAnswered={allAnswered}
          isSubmitting={isSubmitting}
          onCheck={onCheck}
          onSubmit={onSubmit}
        />
      </TestBottomBar>
    </div>
  );
}
