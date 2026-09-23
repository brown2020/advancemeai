"use client";

import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";

interface MasteryData {
  notStarted: number;
  learning: number;
  familiar: number;
  mastered: number;
}

interface MasteryChartProps {
  data: MasteryData;
  className?: string;
}

type SegmentKey = keyof MasteryData;

const SEGMENTS: { key: SegmentKey; label: string; stroke: string; swatch: string }[] = [
  { key: "mastered", label: "Mastered", stroke: "stroke-success", swatch: "bg-success" },
  { key: "familiar", label: "Familiar", stroke: "stroke-primary", swatch: "bg-primary" },
  { key: "learning", label: "Learning", stroke: "stroke-warning", swatch: "bg-warning" },
  { key: "notStarted", label: "Not started", stroke: "stroke-muted-foreground/30", swatch: "bg-muted-foreground/30" },
];

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** Visual gap between segments, in circumference units. */
const GAP = 1.5;

/** Donut chart of flashcard mastery levels with a legend. */
export function MasteryChart({ data, className }: MasteryChartProps) {
  const { total, arcs } = useMemo(() => {
    const total = data.notStarted + data.learning + data.familiar + data.mastered;
    let offset = 0;
    const arcs = SEGMENTS.map((segment) => {
      const count = data[segment.key];
      const length = total > 0 ? (count / total) * CIRCUMFERENCE : 0;
      const arc = {
        ...segment,
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
        length,
        offset,
      };
      offset += length;
      return arc;
    });
    return { total, arcs };
  }, [data]);

  const visibleArcs = arcs.filter((a) => a.count > 0);
  const gap = visibleArcs.length > 1 ? GAP : 0;
  const masteredPct = arcs[0]?.percent ?? 0;

  return (
    <div className={cn("flex flex-col items-center gap-6 sm:flex-row", className)}>
      <div className="relative size-36 shrink-0">
        <svg
          viewBox="0 0 100 100"
          className="size-full -rotate-90"
          role="img"
          aria-label={`${total} cards: ${arcs
            .map((a) => `${a.count} ${a.label.toLowerCase()}`)
            .join(", ")}`}
        >
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            strokeWidth="12"
            className="stroke-secondary"
          />
          {visibleArcs.map((arc) => (
            <circle
              key={arc.key}
              cx="50"
              cy="50"
              r={RADIUS}
              fill="none"
              strokeWidth="12"
              className={cn(arc.stroke, "transition-[stroke-dasharray] duration-500")}
              strokeDasharray={`${Math.max(arc.length - gap, 0.01)} ${CIRCUMFERENCE}`}
              strokeDashoffset={-arc.offset}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums">{total}</span>
          <span className="text-xs text-muted-foreground">cards</span>
        </div>
      </div>

      <div className="w-full min-w-0 flex-1">
        {total > 0 && (
          <p className="mb-3 text-sm">
            <span className="font-semibold text-success tabular-nums">{masteredPct}%</span>{" "}
            <span className="text-muted-foreground">of your cards are mastered</span>
          </p>
        )}
        <ul className="space-y-2 text-sm">
          {arcs.map((arc) => (
            <li key={arc.key} className="flex items-center gap-2.5">
              <span className={cn("size-3 shrink-0 rounded-[4px]", arc.swatch)} aria-hidden />
              <span>{arc.label}</span>
              <span className="ml-auto tabular-nums text-muted-foreground">
                {arc.count}{" "}
                <span className="text-xs">({arc.percent}%)</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Loading skeleton for MasteryChart. */
export function MasteryChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-6 sm:flex-row", className)} aria-hidden>
      <Skeleton className="size-36 rounded-full" />
      <div className="w-full flex-1 space-y-2.5">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <Skeleton className="size-3 rounded-[4px]" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="ml-auto h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
