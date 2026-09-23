"use client";

import { useMemo, useState } from "react";
import { AlertCircle, ArrowDown, ArrowUp, Clock, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Segmented } from "@/components/ui/segmented";
import type { StudentSummary } from "@/types/class-progress";
import { formatTimeSpent } from "@/types/class-progress";
import { cn } from "@/utils/cn";
import {
  filterAndSortStudents,
  masteryBand,
  masteryBarClass,
  masteryTextClass,
  type MasteryFilter,
  type SortOrder,
  type StudentSortKey,
} from "./class-progress-utils";

function FilterLabel({ dot, text, count }: { dot?: string; text: string; count: number }) {
  return (
    <>
      {dot && <span className={cn("size-2 rounded-full", dot)} aria-hidden />}
      {text}
      <span className="tabular-nums opacity-70">{count}</span>
    </>
  );
}

function SortHeader({
  column,
  label,
  sortBy,
  sortOrder,
  onSort,
}: {
  column: StudentSortKey;
  label: string;
  sortBy: StudentSortKey;
  sortOrder: SortOrder;
  onSort: (column: StudentSortKey) => void;
}) {
  const active = sortBy === column;
  return (
    <th
      scope="col"
      className="px-5 py-3 text-left font-medium"
      aria-sort={active ? (sortOrder === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          "inline-flex items-center gap-1 rounded hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          active && "text-foreground"
        )}
      >
        {label}
        {active &&
          (sortOrder === "asc" ? (
            <ArrowUp className="size-3.5" aria-hidden />
          ) : (
            <ArrowDown className="size-3.5" aria-hidden />
          ))}
      </button>
    </th>
  );
}

/** Filterable, sortable roster of student progress. */
export function ClassStudentTable({ students }: { students: StudentSummary[] }) {
  const [sortBy, setSortBy] = useState<StudentSortKey>("mastery");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filter, setFilter] = useState<MasteryFilter>("all");

  const rows = useMemo(
    () => filterAndSortStudents(students, filter, sortBy, sortOrder),
    [students, filter, sortBy, sortOrder]
  );

  const counts = useMemo(() => {
    const c = { low: 0, medium: 0, high: 0 };
    for (const s of students) c[masteryBand(s.overallMastery)]++;
    return c;
  }, [students]);

  const toggleSort = (column: StudentSortKey) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const sortProps = { sortBy, sortOrder, onSort: toggleSort };

  return (
    <Card>
      <div className="space-y-4 border-b border-border p-5">
        <div>
          <h3 className="font-semibold">Student progress</h3>
          <p className="text-sm text-muted-foreground">
            Individual performance and activity
          </p>
        </div>
        <Segmented<MasteryFilter>
          label="Filter students by mastery"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: <FilterLabel text="All" count={students.length} /> },
            {
              value: "low",
              label: <FilterLabel dot="bg-destructive" text="Needs attention" count={counts.low} />,
            },
            {
              value: "medium",
              label: <FilterLabel dot="bg-warning" text="In progress" count={counts.medium} />,
            },
            {
              value: "high",
              label: <FilterLabel dot="bg-success" text="Mastered" count={counts.high} />,
            },
          ]}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <SortHeader column="name" label="Student" {...sortProps} />
              <SortHeader column="mastery" label="Mastery" {...sortProps} />
              <th scope="col" className="px-5 py-3 text-left font-medium">
                Sets
              </th>
              <th scope="col" className="px-5 py-3 text-left font-medium">
                Time spent
              </th>
              <SortHeader column="lastActive" label="Last active" {...sortProps} />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                  <Users className="mx-auto mb-2 size-8 opacity-50" aria-hidden />
                  {students.length === 0
                    ? "No students have joined yet"
                    : "No students match this filter"}
                </td>
              </tr>
            ) : (
              rows.map((student) => (
                <tr key={student.userId} className="border-b border-border last:border-0">
                  <td className="px-5 py-3">
                    <p className="font-medium">{student.displayName}</p>
                    {student.email && (
                      <p className="text-xs text-muted-foreground">{student.email}</p>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Progress
                        value={student.overallMastery}
                        label={`${student.displayName} mastery`}
                        className="w-20"
                        indicatorClassName={masteryBarClass(student.overallMastery)}
                      />
                      <span
                        className={cn(
                          "font-semibold tabular-nums",
                          masteryTextClass(student.overallMastery)
                        )}
                      >
                        {student.overallMastery}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 tabular-nums">
                    {student.setsCompleted}/{student.totalSets} completed
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" aria-hidden />
                      {formatTimeSpent(student.totalTimeSpentSeconds)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {student.lastActiveAt ? (
                      new Date(student.lastActiveAt).toLocaleDateString()
                    ) : (
                      <span className="inline-flex items-center gap-1 text-warning">
                        <AlertCircle className="size-3.5" aria-hidden />
                        Never
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
