"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/utils/cn";
import { AnswerTile } from "./AnswerTile";
import { LiveDemoBadge } from "./LiveDemoBadge";
import type { DemoQuestion } from "./live-demo";

/** Single-device practice round with big answer tiles. */
export function LiveDemoRound({
  questions,
  onFinish,
}: {
  questions: DemoQuestion[];
  onFinish: (correct: number, total: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);

  const question = questions[index];
  if (!question) return null;

  const total = questions.length;
  const answered = picked !== null;
  const wasRight = picked === question.correctIndex;
  const isLast = index === total - 1;

  const pick = (i: number) => {
    if (answered) return;
    setPicked(i);
    if (i === question.correctIndex) setCorrect((c) => c + 1);
  };

  const next = () => {
    if (isLast) {
      onFinish(correct, total);
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <LiveDemoBadge />
        <Progress
          value={((index + (answered ? 1 : 0)) / total) * 100}
          label={`Question ${index + 1} of ${total}`}
          className="flex-1"
        />
        <span className="text-sm font-semibold tabular-nums text-muted-foreground">
          {index + 1}/{total}
        </span>
      </div>

      <Card key={question.id} className="animate-fade-in px-6 py-10 text-center sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Which definition matches?
        </p>
        <p className="mt-3 break-words text-2xl font-bold sm:text-3xl">{question.term}</p>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {question.options.map((option, i) => (
          <AnswerTile
            key={`${question.id}-${i}`}
            index={i}
            label={option}
            disabled={answered}
            onClick={() => pick(i)}
            state={
              !answered
                ? "idle"
                : i === question.correctIndex
                  ? "correct"
                  : i === picked
                    ? "wrong"
                    : "dimmed"
            }
          />
        ))}
      </div>

      <div className="flex min-h-12 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div aria-live="polite">
          {answered && (
            <p
              className={cn(
                "flex items-center gap-2 font-semibold",
                wasRight ? "text-success" : "text-destructive"
              )}
            >
              {wasRight ? (
                <CheckCircle2 className="size-5" aria-hidden />
              ) : (
                <XCircle className="size-5" aria-hidden />
              )}
              {wasRight ? "Correct!" : "Not this time"}
              <span className="font-normal tabular-nums text-muted-foreground">
                · {correct} correct
              </span>
            </p>
          )}
        </div>
        {answered && (
          <Button size="lg" onClick={next}>
            {isLast ? "See results" : "Next"}
            <ArrowRight aria-hidden />
          </Button>
        )}
      </div>
    </div>
  );
}
