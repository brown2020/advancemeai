"use client";

import { useState } from "react";
import { BookOpen, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/common/UIComponents";
import type { ClassSetStatistics } from "@/types/class-progress";
import { formatTimeSpent } from "@/types/class-progress";
import { cn } from "@/utils/cn";
import { masteryBarClass, masteryTextClass } from "./class-progress-utils";

/** Expandable per-set progress rows. */
export function ClassSetProgressList({ setStatistics }: { setStatistics: ClassSetStatistics[] }) {
  const [expandedSet, setExpandedSet] = useState<string | null>(null);

  return (
    <Card>
      <div className="border-b border-border p-5">
        <h3 className="font-semibold">Set progress</h3>
        <p className="text-sm text-muted-foreground">
          How students are moving through each flashcard set
        </p>
      </div>

      {setStatistics.length === 0 ? (
        <EmptyState
          className="m-5 py-10"
          icon={<BookOpen />}
          title="No sets assigned yet"
          message="Share a flashcard set with the class to start tracking progress."
        />
      ) : (
        <ul className="divide-y divide-border">
          {setStatistics.map((stat) => {
            const expanded = expandedSet === stat.setId;
            const panelId = `set-progress-${stat.setId}`;
            return (
              <li key={stat.setId} className="p-5">
                <button
                  type="button"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => setExpandedSet(expanded ? null : stat.setId)}
                  className="flex w-full items-center justify-between gap-4 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{stat.setTitle}</p>
                    <p className="text-sm text-muted-foreground">
                      {stat.studentsStarted} of {stat.totalStudents} started ·{" "}
                      {stat.studentsCompleted} completed
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                      <p className={cn("font-semibold tabular-nums", masteryTextClass(stat.averageMastery))}>
                        {stat.averageMastery}% avg
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeSpent(stat.averageTimeSpent)} avg time
                      </p>
                    </div>
                    <ChevronDown
                      className={cn(
                        "size-5 text-muted-foreground transition-transform",
                        expanded && "rotate-180"
                      )}
                      aria-hidden
                    />
                  </div>
                </button>

                <Progress
                  value={stat.averageMastery}
                  label={`${stat.setTitle} average mastery`}
                  className="mt-3"
                  indicatorClassName={masteryBarClass(stat.averageMastery)}
                />

                {expanded && (
                  <dl
                    id={panelId}
                    className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4 text-sm"
                  >
                    <div>
                      <dt className="text-muted-foreground">Not started</dt>
                      <dd className="font-semibold tabular-nums">
                        {stat.totalStudents - stat.studentsStarted}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">In progress</dt>
                      <dd className="font-semibold tabular-nums">
                        {stat.studentsStarted - stat.studentsCompleted}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Completed</dt>
                      <dd className="font-semibold tabular-nums text-success">
                        {stat.studentsCompleted}
                      </dd>
                    </div>
                  </dl>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
