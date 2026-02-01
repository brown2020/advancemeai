"use client";

import { useMemo } from "react";
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

/**
 * Donut chart showing mastery distribution
 */
export function MasteryChart({ data, className }: MasteryChartProps) {
  const { segments, total, percentages } = useMemo(() => {
    const total = data.notStarted + data.learning + data.familiar + data.mastered;

    if (total === 0) {
      return {
        segments: [],
        total: 0,
        percentages: { notStarted: 0, learning: 0, familiar: 0, mastered: 0 },
      };
    }

    const percentages = {
      notStarted: Math.round((data.notStarted / total) * 100),
      learning: Math.round((data.learning / total) * 100),
      familiar: Math.round((data.familiar / total) * 100),
      mastered: Math.round((data.mastered / total) * 100),
    };

    // Create SVG arc segments
    const segments: { color: string; startAngle: number; endAngle: number; label: string }[] = [];
    let currentAngle = -90; // Start from top

    const addSegment = (count: number, color: string, label: string) => {
      if (count === 0) return;
      const angle = (count / total) * 360;
      segments.push({
        color,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        label,
      });
      currentAngle += angle;
    };

    addSegment(data.mastered, "#22c55e", "Mastered");
    addSegment(data.familiar, "#3b82f6", "Familiar");
    addSegment(data.learning, "#f59e0b", "Learning");
    addSegment(data.notStarted, "#94a3b8", "Not Started");

    return { segments, total, percentages };
  }, [data]);

  // SVG helpers
  const polarToCartesian = (angle: number, radius: number) => {
    const radians = (angle * Math.PI) / 180;
    return {
      x: 50 + radius * Math.cos(radians),
      y: 50 + radius * Math.sin(radians),
    };
  };

  const createArc = (startAngle: number, endAngle: number, innerRadius: number, outerRadius: number) => {
    const start1 = polarToCartesian(startAngle, outerRadius);
    const end1 = polarToCartesian(endAngle, outerRadius);
    const start2 = polarToCartesian(endAngle, innerRadius);
    const end2 = polarToCartesian(startAngle, innerRadius);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return `
      M ${start1.x} ${start1.y}
      A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${end1.x} ${end1.y}
      L ${start2.x} ${start2.y}
      A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${end2.x} ${end2.y}
      Z
    `;
  };

  const colors = {
    mastered: { bg: "bg-green-500", text: "text-green-500" },
    familiar: { bg: "bg-blue-500", text: "text-blue-500" },
    learning: { bg: "bg-amber-500", text: "text-amber-500" },
    notStarted: { bg: "bg-slate-400", text: "text-slate-400" },
  };

  return (
    <div className={cn("flex items-center gap-6", className)}>
      {/* Donut chart */}
      <div className="relative w-32 h-32 flex-shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {total === 0 ? (
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              className="text-muted"
            />
          ) : (
            segments.map((segment, idx) => (
              <path
                key={idx}
                d={createArc(segment.startAngle, segment.endAngle - 0.5, 28, 40)}
                fill={segment.color}
                className="transition-all duration-300"
              />
            ))
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-muted-foreground">cards</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center gap-2">
          <div className={cn("w-3 h-3 rounded-sm", colors.mastered.bg)} />
          <span>Mastered</span>
          <span className="text-muted-foreground ml-auto">{data.mastered} ({percentages.mastered}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("w-3 h-3 rounded-sm", colors.familiar.bg)} />
          <span>Familiar</span>
          <span className="text-muted-foreground ml-auto">{data.familiar} ({percentages.familiar}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("w-3 h-3 rounded-sm", colors.learning.bg)} />
          <span>Learning</span>
          <span className="text-muted-foreground ml-auto">{data.learning} ({percentages.learning}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={cn("w-3 h-3 rounded-sm", colors.notStarted.bg)} />
          <span>Not Started</span>
          <span className="text-muted-foreground ml-auto">{data.notStarted} ({percentages.notStarted}%)</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for MasteryChart
 */
export function MasteryChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-6 animate-pulse", className)}>
      <div className="w-32 h-32 rounded-full bg-muted" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-muted" />
            <div className="w-16 h-4 bg-muted rounded" />
            <div className="w-10 h-4 bg-muted rounded ml-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
