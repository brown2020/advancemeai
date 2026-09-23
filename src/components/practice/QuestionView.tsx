import { cn } from "@/utils/cn";

type QuestionViewProps = {
  questionNumber?: number;
  questionText: string;
  passage?: string | null;
  /** Controls beside the question number (e.g. bookmark). */
  headerActions?: React.ReactNode;
  /** Above the question (e.g. micro-lesson tip). */
  preface?: React.ReactNode;
  /** Answer choices, feedback, etc. */
  children: React.ReactNode;
};

function PassagePane({ passage }: { passage: string }) {
  return (
    <section
      aria-label="Passage"
      className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6 lg:sticky lg:top-36 lg:max-h-[calc(100svh-15rem)] lg:overflow-y-auto"
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Passage
      </p>
      <div className="space-y-4 font-serif text-base leading-relaxed">
        {passage.split("\n\n").map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}

/**
 * Test-taking layout: passage and question side by side on desktop,
 * stacked on mobile. Without a passage the question is centered.
 */
export function QuestionView({
  questionNumber,
  questionText,
  passage,
  headerActions,
  preface,
  children,
}: QuestionViewProps) {
  const hasPassage = Boolean(passage);

  return (
    <div
      className={cn(
        "mx-auto w-full px-4 py-6 sm:px-6 md:py-8",
        hasPassage
          ? "grid max-w-7xl items-start gap-6 lg:grid-cols-2 lg:gap-8"
          : "max-w-3xl"
      )}
    >
      {passage && <PassagePane passage={passage} />}

      <section aria-label="Question" className="min-w-0 space-y-5">
        {preface}
        <div className="flex items-center justify-between gap-3">
          {questionNumber !== undefined && (
            <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-foreground px-2 text-sm font-bold tabular-nums text-background">
              {questionNumber}
            </span>
          )}
          {headerActions}
        </div>
        <h2 className="text-lg font-medium leading-relaxed sm:text-xl">
          {questionText}
        </h2>
        {children}
      </section>
    </div>
  );
}
