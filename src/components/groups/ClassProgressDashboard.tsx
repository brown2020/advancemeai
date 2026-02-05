"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Users,
  BookOpen,
  Clock,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Download,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import type {
  StudentSummary,
  ClassSetStatistics,
} from "@/types/class-progress";
import { formatTimeSpent } from "@/types/class-progress";

interface ClassProgressDashboardProps {
  className?: string;
  totalStudents: number;
  activeStudents: number;
  averageMastery: number;
  setStatistics: ClassSetStatistics[];
  studentSummaries: StudentSummary[];
}

/**
 * Convert student progress data to CSV format
 */
function generateProgressCSV(
  _className: string,
  studentSummaries: StudentSummary[],
  setStatistics: ClassSetStatistics[]
): string {
  const rows: string[] = [];

  // Header
  rows.push(
    "Student Name,Email,Overall Mastery (%),Sets Completed,Total Sets,Time Spent,Last Active"
  );

  // Student data
  for (const student of studentSummaries) {
    const row = [
      `"${student.displayName}"`,
      student.email || "",
      student.overallMastery.toString(),
      student.setsCompleted.toString(),
      student.totalSets.toString(),
      formatTimeSpent(student.totalTimeSpentSeconds),
      student.lastActiveAt
        ? new Date(student.lastActiveAt).toLocaleDateString()
        : "Never",
    ];
    rows.push(row.join(","));
  }

  // Add set statistics section
  rows.push("");
  rows.push("Set Statistics");
  rows.push(
    "Set Name,Students Started,Students Completed,Average Mastery (%),Average Time Spent"
  );

  for (const stat of setStatistics) {
    const row = [
      `"${stat.setTitle}"`,
      stat.studentsStarted.toString(),
      stat.studentsCompleted.toString(),
      stat.averageMastery.toString(),
      formatTimeSpent(stat.averageTimeSpent),
    ];
    rows.push(row.join(","));
  }

  return rows.join("\n");
}

/**
 * Download CSV file
 */
function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function ClassProgressDashboard({
  className,
  totalStudents,
  activeStudents,
  averageMastery,
  setStatistics,
  studentSummaries,
}: ClassProgressDashboardProps) {
  const [expandedSet, setExpandedSet] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "mastery" | "lastActive">(
    "mastery"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterMastery, setFilterMastery] = useState<
    "all" | "low" | "medium" | "high"
  >("all");

  const handleExportCSV = useCallback(() => {
    const csv = generateProgressCSV(className ?? "", studentSummaries, setStatistics);
    const sanitizedName = (className ?? "").replace(/[^a-z0-9]/gi, "_").toLowerCase();
    downloadCSV(
      csv,
      `${sanitizedName}_progress_${new Date().toISOString().split("T")[0]}.csv`
    );
  }, [className, studentSummaries, setStatistics]);

  const filteredAndSortedStudents = useMemo(() => {
    // Filter by mastery level
    let filtered = [...studentSummaries];
    switch (filterMastery) {
      case "low":
        filtered = filtered.filter((s) => s.overallMastery < 50);
        break;
      case "medium":
        filtered = filtered.filter(
          (s) => s.overallMastery >= 50 && s.overallMastery < 80
        );
        break;
      case "high":
        filtered = filtered.filter((s) => s.overallMastery >= 80);
        break;
    }

    // Sort
    return filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.displayName.localeCompare(b.displayName);
          break;
        case "mastery":
          comparison = a.overallMastery - b.overallMastery;
          break;
        case "lastActive":
          comparison = (a.lastActiveAt ?? 0) - (b.lastActiveAt ?? 0);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [studentSummaries, sortBy, sortOrder, filterMastery]);

  // Stats for the filtered view
  const needsAttentionCount = studentSummaries.filter(
    (s) => s.overallMastery < 50
  ).length;
  const inProgressCount = studentSummaries.filter(
    (s) => s.overallMastery >= 50 && s.overallMastery < 80
  ).length;
  const masteredCount = studentSummaries.filter(
    (s) => s.overallMastery >= 80
  ).length;

  const toggleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const getMasteryColor = (mastery: number) => {
    if (mastery >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (mastery >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getMasteryBgColor = (mastery: number) => {
    if (mastery >= 80) return "bg-emerald-500";
    if (mastery >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Header with Export */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Class Progress</h2>
          <p className="text-sm text-muted-foreground">
            Track student performance and identify areas for improvement
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExportCSV}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="h-4 w-4" />
            <span className="text-sm">Students</span>
          </div>
          <div className="text-2xl font-bold">{totalStudents}</div>
          <div className="text-xs text-muted-foreground">
            {activeStudents} active this week
          </div>
        </div>

        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <BookOpen className="h-4 w-4" />
            <span className="text-sm">Sets Assigned</span>
          </div>
          <div className="text-2xl font-bold">{setStatistics.length}</div>
        </div>

        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Class Average</span>
          </div>
          <div
            className={cn(
              "text-2xl font-bold",
              getMasteryColor(averageMastery)
            )}
          >
            {averageMastery}%
          </div>
        </div>

        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm">Completion Rate</span>
          </div>
          <div className="text-2xl font-bold">
            {setStatistics.length > 0
              ? Math.round(
                  (setStatistics.reduce(
                    (sum, s) => sum + s.studentsCompleted,
                    0
                  ) /
                    (setStatistics.length * totalStudents)) *
                    100
                )
              : 0}
            %
          </div>
        </div>
      </div>

      {/* Set Progress */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Set Progress</h3>
          <p className="text-sm text-muted-foreground">
            How students are progressing through each flashcard set
          </p>
        </div>
        <div className="divide-y">
          {setStatistics.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No sets have been assigned yet</p>
            </div>
          ) : (
            setStatistics.map((stat) => (
              <div key={stat.setId} className="p-4">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() =>
                    setExpandedSet(
                      expandedSet === stat.setId ? null : stat.setId
                    )
                  }
                >
                  <div>
                    <div className="font-medium">{stat.setTitle}</div>
                    <div className="text-sm text-muted-foreground">
                      {stat.studentsStarted} of {stat.totalStudents} started •{" "}
                      {stat.studentsCompleted} completed
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div
                        className={cn(
                          "font-medium",
                          getMasteryColor(stat.averageMastery)
                        )}
                      >
                        {stat.averageMastery}% avg
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTimeSpent(stat.averageTimeSpent)} avg time
                      </div>
                    </div>
                    {expandedSet === stat.setId ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all",
                      getMasteryBgColor(stat.averageMastery)
                    )}
                    style={{ width: `${stat.averageMastery}%` }}
                  />
                </div>

                {expandedSet === stat.setId && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Not Started</div>
                        <div className="font-medium">
                          {stat.totalStudents - stat.studentsStarted}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">In Progress</div>
                        <div className="font-medium">
                          {stat.studentsStarted - stat.studentsCompleted}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Completed</div>
                        <div className="font-medium text-emerald-600">
                          {stat.studentsCompleted}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Student List */}
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold">Student Progress</h3>
              <p className="text-sm text-muted-foreground">
                Individual student performance and activity
              </p>
            </div>
          </div>

          {/* Filter buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterMastery("all")}
              className={cn(
                "px-3 py-1.5 text-sm rounded-full transition-colors",
                filterMastery === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              All ({studentSummaries.length})
            </button>
            <button
              onClick={() => setFilterMastery("low")}
              className={cn(
                "px-3 py-1.5 text-sm rounded-full transition-colors",
                filterMastery === "low"
                  ? "bg-red-500 text-white"
                  : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
              )}
            >
              Needs Attention ({needsAttentionCount})
            </button>
            <button
              onClick={() => setFilterMastery("medium")}
              className={cn(
                "px-3 py-1.5 text-sm rounded-full transition-colors",
                filterMastery === "medium"
                  ? "bg-yellow-500 text-white"
                  : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400"
              )}
            >
              In Progress ({inProgressCount})
            </button>
            <button
              onClick={() => setFilterMastery("high")}
              className={cn(
                "px-3 py-1.5 text-sm rounded-full transition-colors",
                filterMastery === "high"
                  ? "bg-emerald-500 text-white"
                  : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
              )}
            >
              Mastered ({masteredCount})
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-sm text-muted-foreground">
                <th className="text-left p-4">
                  <button
                    onClick={() => toggleSort("name")}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Student
                    {sortBy === "name" && (
                      <span className="text-xs">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </button>
                </th>
                <th className="text-left p-4">
                  <button
                    onClick={() => toggleSort("mastery")}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Mastery
                    {sortBy === "mastery" && (
                      <span className="text-xs">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </button>
                </th>
                <th className="text-left p-4">Sets</th>
                <th className="text-left p-4">Time Spent</th>
                <th className="text-left p-4">
                  <button
                    onClick={() => toggleSort("lastActive")}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    Last Active
                    {sortBy === "lastActive" && (
                      <span className="text-xs">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-6 text-center text-muted-foreground"
                  >
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    {studentSummaries.length === 0
                      ? "No students have joined yet"
                      : "No students match the current filter"}
                  </td>
                </tr>
              ) : (
                filteredAndSortedStudents.map((student) => (
                  <tr key={student.userId} className="border-b last:border-0">
                    <td className="p-4">
                      <div className="font-medium">{student.displayName}</div>
                      {student.email && (
                        <div className="text-xs text-muted-foreground">
                          {student.email}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              "h-full",
                              getMasteryBgColor(student.overallMastery)
                            )}
                            style={{ width: `${student.overallMastery}%` }}
                          />
                        </div>
                        <span
                          className={cn(
                            "text-sm font-medium",
                            getMasteryColor(student.overallMastery)
                          )}
                        >
                          {student.overallMastery}%
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      {student.setsCompleted}/{student.totalSets} completed
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeSpent(student.totalTimeSpentSeconds)}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {student.lastActiveAt ? (
                        new Date(student.lastActiveAt).toLocaleDateString()
                      ) : (
                        <span className="flex items-center gap-1 text-yellow-600">
                          <AlertCircle className="h-3 w-3" />
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
      </div>
    </div>
  );
}
