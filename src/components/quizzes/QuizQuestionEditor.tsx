"use client";

import { Check, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/utils/cn";
import { optionLetter } from "./quiz-utils";

export type QuestionDraft = {
  id: number;
  text: string;
  options: string[];
  correctIndex: number | null;
};

type QuizQuestionEditorProps = {
  question: QuestionDraft;
  number: number;
  canRemove: boolean;
  onChange: (next: QuestionDraft) => void;
  onRemove: () => void;
};

/** One editable question row: prompt, four options, and a correct-answer picker. */
export function QuizQuestionEditor({
  question,
  number,
  canRemove,
  onChange,
  onRemove,
}: QuizQuestionEditorProps) {
  const promptId = `question-${question.id}-prompt`;
  const groupLabelId = `question-${question.id}-options`;

  const updateOption = (index: number, value: string) => {
    const options = question.options.map((opt, i) => (i === index ? value : opt));
    onChange({ ...question, options });
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-sm font-bold tabular-nums text-primary">
            {number}
          </span>
          <h2 className="text-base font-semibold">Question {number}</h2>
        </div>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            aria-label={`Remove question ${number}`}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 aria-hidden />
          </Button>
        )}
      </div>

      <label htmlFor={promptId} className="sr-only">
        Question {number} prompt
      </label>
      <Textarea
        id={promptId}
        value={question.text}
        onChange={(e) => onChange({ ...question, text: e.target.value })}
        placeholder="Type the question"
        rows={2}
        className="min-h-16 text-base"
      />

      <p id={groupLabelId} className="mb-2 mt-5 text-sm font-semibold">
        Answer choices
        <span className="ml-2 font-normal text-muted-foreground">
          Tap a letter to mark the correct one
        </span>
      </p>
      <div role="radiogroup" aria-labelledby={groupLabelId} className="space-y-2">
        {question.options.map((option, index) => {
          const isCorrect = question.correctIndex === index;
          const letter = optionLetter(index);
          return (
            <div key={index} className="flex items-center gap-2">
              <button
                type="button"
                role="radio"
                aria-checked={isCorrect}
                aria-label={`Mark option ${letter} as correct`}
                onClick={() => onChange({ ...question, correctIndex: index })}
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-xl border text-sm font-bold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isCorrect
                    ? "border-success bg-success text-success-foreground"
                    : "border-input bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                {isCorrect ? <Check className="size-5" aria-hidden /> : letter}
              </button>
              <Input
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                placeholder={`Option ${letter}`}
                aria-label={`Question ${number} option ${letter}`}
                className={cn(isCorrect && "border-success/60")}
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
