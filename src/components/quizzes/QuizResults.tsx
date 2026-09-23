import Link from "next/link";
import { CheckCircle2, RotateCcw, Trophy, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Progress } from "@/components/ui/progress";
import { ROUTES } from "@/constants/appConstants";
import { cn } from "@/utils/cn";
import {
  countCorrect,
  scoreMessage,
  type QuizAnswers,
  type TakeableQuiz,
} from "./quiz-utils";

type QuizResultsProps = {
  quiz: TakeableQuiz;
  answers: QuizAnswers;
  onRetake: () => void;
};

/** Score summary plus a per-question review. */
export function QuizResults({ quiz, answers, onRetake }: QuizResultsProps) {
  const total = quiz.questions.length;
  const correct = countCorrect(quiz, answers);
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
  const tone = percent >= 70 ? "success" : percent >= 40 ? "warning" : "destructive";

  return (
    <div className="animate-fade-in space-y-6">
      <Card className="px-6 py-10 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-accent text-primary">
          <Trophy className="size-7" aria-hidden />
        </div>
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Your score
        </p>
        <p className="mt-1 text-5xl font-bold tabular-nums tracking-tight">
          {correct}
          <span className="text-muted-foreground">/{total}</span>
        </p>
        <p className="mt-2 text-lg font-semibold">{scoreMessage(correct, total)}</p>
        <Progress
          value={percent}
          label={`${percent}% correct`}
          className="mx-auto mt-6 h-3 max-w-xs"
          indicatorClassName={cn(
            tone === "success" && "bg-success",
            tone === "warning" && "bg-warning",
            tone === "destructive" && "bg-destructive"
          )}
        />
        <p className="mt-2 text-sm tabular-nums text-muted-foreground">{percent}% correct</p>

        <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
          <Button size="lg" onClick={onRetake}>
            <RotateCcw aria-hidden />
            Retake quiz
          </Button>
          <Link
            href={ROUTES.QUIZZES.INDEX}
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Back to quizzes
          </Link>
        </div>
      </Card>

      <section aria-labelledby="quiz-review">
        <h2 id="quiz-review" className="mb-3 text-lg font-semibold">
          Review
        </h2>
        <ol className="space-y-3">
          {quiz.questions.map((q, i) => {
            const answer = answers[i];
            const right = answer === q.correctAnswer;
            return (
              <li key={i}>
                <Card className="flex gap-3 p-4">
                  {right ? (
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-label="Correct" />
                  ) : (
                    <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-label="Incorrect" />
                  )}
                  <div className="min-w-0 text-sm">
                    <p className="font-semibold">
                      {i + 1}. {q.text}
                    </p>
                    {!right && (
                      <p className="mt-1 text-muted-foreground">
                        Your answer:{" "}
                        <span className="text-destructive">{answer ?? "Skipped"}</span>
                      </p>
                    )}
                    <p className="mt-1 text-muted-foreground">
                      Correct answer: <span className="text-success">{q.correctAnswer}</span>
                    </p>
                  </div>
                </Card>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
