import { BookOpen, CheckCircle2, TrendingUp, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/utils/cn";
import { masteryTextClass } from "./class-progress-utils";

function StatTile({
  icon,
  label,
  value,
  hint,
  valueClassName,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: string;
  valueClassName?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="[&_svg]:size-4" aria-hidden>
          {icon}
        </span>
        {label}
      </div>
      <p className={cn("mt-1 text-2xl font-bold tabular-nums", valueClassName)}>{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}

/** Four headline numbers for the class. */
export function ClassProgressStats({
  totalStudents,
  activeStudents,
  setCount,
  averageMastery,
  completionRate,
}: {
  totalStudents: number;
  activeStudents: number;
  setCount: number;
  averageMastery: number;
  completionRate: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile
        icon={<Users />}
        label="Students"
        value={totalStudents}
        hint={`${activeStudents} active this week`}
      />
      <StatTile icon={<BookOpen />} label="Sets assigned" value={setCount} />
      <StatTile
        icon={<TrendingUp />}
        label="Class average"
        value={`${averageMastery}%`}
        valueClassName={masteryTextClass(averageMastery)}
      />
      <StatTile icon={<CheckCircle2 />} label="Completion" value={`${completionRate}%`} />
    </div>
  );
}
