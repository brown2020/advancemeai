"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ClassProgressDashboardData } from "@/types/class-progress";
import { ClassProgressStats } from "./ClassProgressStats";
import { ClassSetProgressList } from "./ClassSetProgressList";
import { ClassStudentTable } from "./ClassStudentTable";
import { completionRate, downloadCSV, generateProgressCSV } from "./class-progress-utils";

/** Teacher view of class-wide and per-student mastery. */
export function ClassProgressDashboard({ data }: { data: ClassProgressDashboardData }) {
  const { className, totalStudents, activeStudents, averageMastery, setStatistics, studentSummaries } =
    data;

  const handleExportCSV = () => {
    const csv = generateProgressCSV(studentSummaries, setStatistics);
    const sanitizedName = className.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    downloadCSV(csv, `${sanitizedName}_progress_${new Date().toISOString().split("T")[0]}.csv`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="class-progress-heading" className="text-lg font-semibold">
            Class progress
          </h2>
          <p className="text-sm text-muted-foreground">
            Track student performance and spot who needs help
          </p>
        </div>
        <Button variant="outline" onClick={handleExportCSV}>
          <Download aria-hidden />
          Export CSV
        </Button>
      </div>

      <ClassProgressStats
        totalStudents={totalStudents}
        activeStudents={activeStudents}
        setCount={setStatistics.length}
        averageMastery={averageMastery}
        completionRate={completionRate(setStatistics, totalStudents)}
      />
      <ClassSetProgressList setStatistics={setStatistics} />
      <ClassStudentTable students={studentSummaries} />
    </div>
  );
}

/** Loading placeholder for the progress tab. */
export function ClassProgressSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading class progress">
      <Skeleton className="h-8 w-48 rounded-lg" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {["s1", "s2", "s3", "s4"].map((id) => (
          <Skeleton key={id} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-56 w-full rounded-2xl" />
    </div>
  );
}
