import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  /** Small line under the value. */
  hint?: React.ReactNode;
  /** Colors for the icon chip. Defaults to the accent/primary chip. */
  tone?: "primary" | "streak" | "success" | "warning";
  /** Extra content under the hint (e.g. an XP bar). */
  children?: React.ReactNode;
  isLoading?: boolean;
  className?: string;
}

const TONE_CLASSES = {
  primary: "bg-accent text-primary",
  streak: "bg-streak/10 text-streak",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning",
} as const;

/** Headline metric tile for the progress dashboard. */
export function StatTile({
  label,
  value,
  icon: Icon,
  hint,
  tone = "primary",
  children,
  isLoading,
  className,
}: StatTileProps) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5",
        className
      )}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl",
            TONE_CLASSES[tone]
          )}
        >
          <Icon className="size-[18px]" aria-hidden />
        </span>
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="mt-3 text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
        {isLoading ? <Skeleton className="h-8 w-16" /> : value}
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {children && <div className="mt-auto pt-3">{children}</div>}
    </div>
  );
}
