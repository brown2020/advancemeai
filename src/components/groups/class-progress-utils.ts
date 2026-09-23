import type { ClassSetStatistics, StudentSummary } from "@/types/class-progress";
import { formatTimeSpent } from "@/types/class-progress";

export type MasteryFilter = "all" | "low" | "medium" | "high";
export type StudentSortKey = "name" | "mastery" | "lastActive";
export type SortOrder = "asc" | "desc";

/** Mastery bands: <50 needs attention, 50–79 in progress, 80+ mastered. */
export function masteryBand(mastery: number): Exclude<MasteryFilter, "all"> {
  if (mastery >= 80) return "high";
  if (mastery >= 50) return "medium";
  return "low";
}

const TEXT_BY_BAND = { high: "text-success", medium: "text-warning", low: "text-destructive" };
const BAR_BY_BAND = { high: "bg-success", medium: "bg-warning", low: "bg-destructive" };

export function masteryTextClass(mastery: number): string {
  return TEXT_BY_BAND[masteryBand(mastery)];
}

export function masteryBarClass(mastery: number): string {
  return BAR_BY_BAND[masteryBand(mastery)];
}

export function filterAndSortStudents(
  students: StudentSummary[],
  filter: MasteryFilter,
  sortBy: StudentSortKey,
  order: SortOrder
): StudentSummary[] {
  const filtered =
    filter === "all"
      ? [...students]
      : students.filter((s) => masteryBand(s.overallMastery) === filter);

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
    return order === "asc" ? comparison : -comparison;
  });
}

/** Share of (set × student) pairs completed, as a whole percent. */
export function completionRate(setStatistics: ClassSetStatistics[], totalStudents: number): number {
  const slots = setStatistics.length * totalStudents;
  if (slots === 0) return 0;
  const completed = setStatistics.reduce((sum, s) => sum + s.studentsCompleted, 0);
  return Math.round((completed / slots) * 100);
}

/** Student roster + per-set statistics as CSV text. */
export function generateProgressCSV(
  studentSummaries: StudentSummary[],
  setStatistics: ClassSetStatistics[]
): string {
  const rows: string[] = [
    "Student Name,Email,Overall Mastery (%),Sets Completed,Total Sets,Time Spent,Last Active",
  ];

  for (const student of studentSummaries) {
    rows.push(
      [
        `"${student.displayName}"`,
        student.email || "",
        student.overallMastery.toString(),
        student.setsCompleted.toString(),
        student.totalSets.toString(),
        formatTimeSpent(student.totalTimeSpentSeconds),
        student.lastActiveAt ? new Date(student.lastActiveAt).toLocaleDateString() : "Never",
      ].join(",")
    );
  }

  rows.push("", "Set Statistics");
  rows.push("Set Name,Students Started,Students Completed,Average Mastery (%),Average Time Spent");

  for (const stat of setStatistics) {
    rows.push(
      [
        `"${stat.setTitle}"`,
        stat.studentsStarted.toString(),
        stat.studentsCompleted.toString(),
        stat.averageMastery.toString(),
        formatTimeSpent(stat.averageTimeSpent),
      ].join(",")
    );
  }

  return rows.join("\n");
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
