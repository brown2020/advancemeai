import Link from "next/link";
import { Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ROUTES } from "@/constants/appConstants";

type SetProgressCardProps = {
  setId: string;
  masteredCount: number;
  totalCount: number;
  timesStudied: number;
  isSignedIn: boolean;
};

/** Mastery summary for the current learner. */
export function SetProgressCard({
  setId,
  masteredCount,
  totalCount,
  timesStudied,
  isSignedIn,
}: SetProgressCardProps) {
  const progressPercent =
    totalCount === 0 ? 0 : Math.round((masteredCount / totalCount) * 100);

  return (
    <section
      aria-labelledby="set-progress-heading"
      className="rounded-2xl border border-border bg-card p-5 shadow-card"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
          <Trophy className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="set-progress-heading" className="text-sm font-semibold">
            Your progress
          </h2>
          <p className="text-sm text-muted-foreground tabular-nums">
            {masteredCount} of {totalCount} mastered
            {timesStudied > 0 ? ` · studied ${timesStudied}×` : ""}
          </p>
        </div>
        <span className="text-lg font-bold tabular-nums">{progressPercent}%</span>
      </div>
      <Progress
        value={progressPercent}
        label="Terms mastered"
        className="mt-4"
        indicatorClassName="bg-success"
      />
      {!isSignedIn ? (
        <p className="mt-3 text-xs text-muted-foreground">
          <Link
            href={`${ROUTES.AUTH.LOGIN}?returnTo=${encodeURIComponent(ROUTES.FLASHCARDS.SET(setId))}`}
            className="font-semibold text-primary hover:underline"
          >
            Sign in
          </Link>{" "}
          to sync progress across devices.
        </p>
      ) : null}
    </section>
  );
}
