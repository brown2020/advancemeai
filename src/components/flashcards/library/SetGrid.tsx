"use client";

import type { FlashcardSet } from "@/types/flashcard";
import { CardGrid } from "@/components/common/UIComponents";
import { Skeleton } from "@/components/ui/skeleton";
import { FlashcardSetCard } from "@/components/flashcards/FlashcardSetCard";

type SetGridProps = {
  sets: FlashcardSet[];
  viewerUserId?: string;
  /** Show skeleton cards instead of the grid (initial load with no data yet). */
  isLoading?: boolean;
  /** Rendered when there are no sets and not loading. */
  empty?: React.ReactNode;
  /** Per-set extra controls (e.g. folder menu). */
  renderActions?: (set: FlashcardSet) => React.ReactNode;
};

export function SetCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="mt-3 h-5 w-16 rounded-full" />
      <Skeleton className="mt-4 h-4 w-full" />
      <Skeleton className="mt-6 h-3 w-1/3" />
    </div>
  );
}

export function SetGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <CardGrid>
      {Array.from({ length: count }, (_, i) => (
        <SetCardSkeleton key={i} />
      ))}
    </CardGrid>
  );
}

export function SetGrid({
  sets,
  viewerUserId,
  isLoading,
  empty,
  renderActions,
}: SetGridProps) {
  if (isLoading && sets.length === 0) return <SetGridSkeleton />;
  if (sets.length === 0) return <>{empty}</>;

  return (
    <CardGrid>
      {sets.map((set) => (
        <FlashcardSetCard
          key={set.id}
          set={set}
          viewerUserId={viewerUserId}
          actions={renderActions?.(set)}
        />
      ))}
    </CardGrid>
  );
}
