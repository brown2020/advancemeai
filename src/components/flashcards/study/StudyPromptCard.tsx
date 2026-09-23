import { cn } from "@/utils/cn";

type StudyPromptCardProps = {
  /** Small uppercase label, e.g. "Term". */
  label: string;
  /** Right-aligned meta next to the label. */
  meta?: React.ReactNode;
  imageUrl?: string;
  children: React.ReactNode;
  className?: string;
};

/** The question/prompt shown at the top of Learn, Write and Test questions. */
export function StudyPromptCard({
  label,
  meta,
  imageUrl,
  children,
  className,
}: StudyPromptCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-card sm:p-8",
        className
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        {meta ? <span className="normal-case tracking-normal">{meta}</span> : null}
      </div>
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <p className="min-w-0 flex-1 whitespace-pre-wrap break-words text-xl font-semibold leading-snug sm:text-2xl">
          {children}
        </p>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="max-h-40 w-auto max-w-full rounded-xl object-contain sm:max-w-[40%]"
          />
        ) : null}
      </div>
    </div>
  );
}
