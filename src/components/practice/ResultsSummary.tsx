import { CalendarDays, CheckCircle2, Clock, Target, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";
import { formatDuration, percent } from "./sectionMeta";

function accuracyTone(accuracy: number) {
  if (accuracy >= 80) return { text: "text-success", bar: "bg-success", label: "Strong" } as const;
  if (accuracy >= 60) return { text: "text-warning", bar: "bg-warning", label: "Developing" } as const;
  return { text: "text-destructive", bar: "bg-destructive", label: "Needs work" } as const;
}

type ScoreSummaryProps = {
  score: number;
  total: number;
  timeSeconds: number;
  completedAt: Date | number | string;
};

/** Big-number score header with accuracy, time and date tiles. */
export function ScoreSummary({
  score,
  total,
  timeSeconds,
  completedAt,
}: ScoreSummaryProps) {
  const accuracy = percent(score, total);
  const tone = accuracyTone(accuracy);

  return (
    <section
      aria-label="Score summary"
      className="mb-8 rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8"
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Your score</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="text-5xl font-bold tracking-tight tabular-nums sm:text-6xl">
              {score}
            </span>
            <span className="text-2xl font-semibold tabular-nums text-muted-foreground">
              / {total}
            </span>
          </p>
        </div>
        <div className="sm:text-right">
          <p className={cn("text-3xl font-bold tabular-nums", tone.text)}>
            {accuracy}%
          </p>
          <p className="text-sm text-muted-foreground">{tone.label}</p>
        </div>
      </div>
      <Progress
        value={accuracy}
        label="Overall accuracy"
        className="mt-5 h-3"
        indicatorClassName={tone.bar}
      />

      <dl className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatTile
          icon={<Target aria-hidden />}
          label="Correct"
          value={`${score} of ${total}`}
        />
        <StatTile
          icon={<Clock aria-hidden />}
          label="Time spent"
          value={formatDuration(timeSeconds)}
        />
        <StatTile
          icon={<CalendarDays aria-hidden />}
          label="Completed"
          value={new Date(completedAt).toLocaleDateString()}
        />
      </dl>
    </section>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-secondary/60 p-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-card text-primary [&_svg]:size-4">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="truncate text-sm font-semibold tabular-nums">{value}</dd>
      </div>
    </div>
  );
}

export type BreakdownItem = {
  id: string;
  label: string;
  score: number;
  total: number;
  meta?: string;
};

/** Per-section accuracy bars. */
export function ScoreBreakdown({ items }: { items: BreakdownItem[] }) {
  return (
    <ul className="space-y-4">
      {items.map((item) => {
        const accuracy = percent(item.score, item.total);
        const tone = accuracyTone(accuracy);
        return (
          <li key={item.id}>
            <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="font-medium">{item.label}</span>
              <span className="text-sm tabular-nums text-muted-foreground">
                {item.score}/{item.total} correct ·{" "}
                <span className={cn("font-semibold", tone.text)}>{accuracy}%</span>
                {item.meta && <> · {item.meta}</>}
              </span>
            </div>
            <Progress
              value={accuracy}
              label={`${item.label} accuracy`}
              indicatorClassName={tone.bar}
            />
          </li>
        );
      })}
    </ul>
  );
}

export type ReviewQuestion = {
  id: string;
  text: string;
  userAnswer?: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
  tag?: string;
  /** Display number; defaults to position in the list. */
  number?: number;
};

/** Question-by-question review list with correct/incorrect markers. */
export function QuestionReviewList({ questions }: { questions: ReviewQuestion[] }) {
  return (
    <ol className="space-y-3">
      {questions.map((question, index) => (
        <li
          key={question.id}
          className={cn(
            "rounded-2xl border bg-card p-4 sm:p-5",
            question.isCorrect ? "border-border" : "border-destructive/30"
          )}
        >
          <div className="flex items-start gap-3">
            {question.isCorrect ? (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-label="Correct" />
            ) : (
              <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-label="Incorrect" />
            )}
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                  Question {question.number ?? index + 1}
                </span>
                {question.tag && <Badge variant="secondary">{question.tag}</Badge>}
              </div>
              <p className="font-medium">{question.text}</p>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Your answer: </span>
                  <span
                    className={cn(
                      "font-medium",
                      question.isCorrect ? "text-success" : "text-destructive"
                    )}
                  >
                    {question.userAnswer || "No answer"}
                  </span>
                </p>
                {!question.isCorrect && (
                  <p>
                    <span className="text-muted-foreground">Correct answer: </span>
                    <span className="font-medium text-success">
                      {question.correctAnswer}
                    </span>
                  </p>
                )}
              </div>
              {question.explanation && (
                <p className="rounded-xl bg-secondary/60 p-3 text-sm leading-relaxed text-muted-foreground">
                  {question.explanation}
                </p>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Placeholder shaped like a results page. */
export function ResultsSkeleton({ message }: { message?: string }) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 md:py-10" aria-busy="true">
      <Skeleton className="mb-2 h-4 w-24" />
      <Skeleton className="mb-8 h-8 w-64" />
      <Skeleton className="mb-8 h-56 w-full rounded-3xl" />
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
      {message && (
        <p className="mt-6 text-center text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
