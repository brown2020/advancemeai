import Link from "next/link";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/utils/cn";
import { formatShortDate } from "./library-utils";

type SetCardProgress = {
  mastered: number;
  total: number;
};

type SetCardFrameProps = {
  href: string;
  title: string;
  description?: string;
  termCount: number;
  updatedAt: number;
  /** Small cue badges shown next to the term count (visibility, "Yours", subjects…). */
  badges?: React.ReactNode;
  /** Extra meta shown after the updated date. */
  meta?: React.ReactNode;
  progress?: SetCardProgress | null;
  /** Secondary controls. Rendered above the stretched link so clicks don't navigate. */
  actions?: React.ReactNode;
  /** Error or status line under the card body. */
  footer?: React.ReactNode;
  className?: string;
};

/**
 * Presentational set card. The whole surface is a link (stretched from the
 * title anchor) while `actions` sit on a higher layer so they stay clickable.
 */
export function SetCardFrame({
  href,
  title,
  description,
  termCount,
  updatedAt,
  badges,
  meta,
  progress,
  actions,
  footer,
  className,
}: SetCardFrameProps) {
  const pct =
    progress && progress.total > 0
      ? Math.round((progress.mastered / progress.total) * 100)
      : 0;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-card sm:p-5",
        "transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift",
        "focus-within:border-primary/40",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 text-base font-semibold leading-snug">
          <Link
            href={href}
            className="line-clamp-2 break-words outline-none after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-ring"
          >
            {title}
          </Link>
        </h3>
        {actions && (
          <div className="relative z-10 -mr-1.5 -mt-1.5 flex shrink-0 items-center gap-0.5">
            {actions}
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary" className="tabular-nums">
          {termCount} {termCount === 1 ? "term" : "terms"}
        </Badge>
        {badges}
      </div>

      {description && (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
          {description}
        </p>
      )}

      <div className="mt-auto pt-4">
        {progress && progress.total > 0 && (
          <div className="mb-3">
            <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
              <span>Mastered</span>
              <span className="tabular-nums">
                {progress.mastered}/{progress.total} · {pct}%
              </span>
            </div>
            <Progress
              value={pct}
              label={`${pct}% of terms mastered`}
              indicatorClassName={pct === 100 ? "bg-success" : undefined}
            />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden />
            Updated {formatShortDate(updatedAt)}
          </span>
          {meta}
        </div>
        {footer && <div className="relative z-10 mt-2">{footer}</div>}
      </div>
    </article>
  );
}
