import { BookOpen, HelpCircle, Layers, ListChecks } from "lucide-react";
import { SectionHeading } from "@/components/common/UIComponents";
import type { StudyGuide } from "@/types/study-guide";

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
      {children}
    </section>
  );
}

/** Step 2: the generated guide (summary, sections, flashcards, questions). */
export function StudyGuideResult({ guide }: { guide: StudyGuide }) {
  const sections = guide.sections ?? [];
  const flashcards = guide.flashcards ?? [];
  const questions = guide.questions ?? [];

  return (
    <div className="space-y-6">
      <Panel>
        <SectionHeading title="Summary" icon={<BookOpen />} />
        <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">{guide.summary}</p>
      </Panel>

      {sections.length > 0 && (
        <Panel>
          <SectionHeading title="Key sections" icon={<ListChecks />} />
          <div className="divide-y divide-border">
            {sections.map((section, index) => (
              <article key={`${index}-${section.title}`} className="py-5 first:pt-0 last:pb-0">
                <h3 className="font-semibold">
                  <span className="mr-2 text-primary tabular-nums">{index + 1}.</span>
                  {section.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.content}</p>
                {section.keyPoints && section.keyPoints.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {section.keyPoints.map((point, pointIndex) => (
                      <li key={`${pointIndex}-${point}`} className="flex items-start gap-2 text-sm">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                        {point}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </Panel>
      )}

      {flashcards.length > 0 && (
        <Panel>
          <SectionHeading
            title={
              <>
                Flashcards{" "}
                <span className="text-sm font-normal text-muted-foreground tabular-nums">
                  {flashcards.length}
                </span>
              </>
            }
            icon={<Layers />}
          />
          <ul className="grid gap-2">
            {flashcards.map((card, index) => (
              <li
                key={`${index}-${card.term}`}
                className="grid grid-cols-1 gap-1 rounded-xl bg-secondary/60 p-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-4"
              >
                <span className="font-semibold">{card.term}</span>
                <span className="text-sm text-muted-foreground">{card.definition}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {questions.length > 0 && (
        <Panel>
          <SectionHeading
            title={
              <>
                Practice questions{" "}
                <span className="text-sm font-normal text-muted-foreground tabular-nums">
                  {questions.length}
                </span>
              </>
            }
            icon={<HelpCircle />}
          />
          <ol className="space-y-3">
            {questions.map((q, index) => (
              <li key={`${index}-${q.question}`} className="rounded-xl bg-secondary/60 p-4">
                <p className="font-medium">
                  <span className="mr-1.5 text-muted-foreground tabular-nums">Q{index + 1}.</span>
                  {q.question}
                </p>
                {q.options && q.options.length > 0 && (
                  <ul className="mt-2 space-y-1 pl-6">
                    {q.options.map((opt, optIndex) => (
                      <li key={`${optIndex}-${opt}`} className="text-sm text-muted-foreground">
                        <span className="font-semibold">{String.fromCharCode(65 + optIndex)}.</span> {opt}
                      </li>
                    ))}
                  </ul>
                )}
                <details className="group mt-3">
                  <summary className="inline-flex min-h-10 cursor-pointer items-center text-sm font-semibold text-primary">
                    <span className="group-open:hidden">Show answer</span>
                    <span className="hidden group-open:inline">Hide answer</span>
                  </summary>
                  <p className="mt-1 rounded-lg bg-success/10 px-3 py-2 text-sm text-foreground">
                    <span className="font-semibold text-success">Answer: </span>
                    {q.answer}
                  </p>
                </details>
              </li>
            ))}
          </ol>
        </Panel>
      )}
    </div>
  );
}
