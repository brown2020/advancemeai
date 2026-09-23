import { PageContainer } from "@/components/common/UIComponents";
import { Skeleton } from "@/components/ui/skeleton";
import { SetGridSkeleton } from "@/components/flashcards/library/SetGrid";

export default function Loading() {
  return (
    <PageContainer>
      <div className="mb-8" aria-busy="true" aria-label="Loading flashcards">
        <Skeleton className="h-9 w-48" />
      </div>
      <div className="mb-5 flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-full" />
        ))}
      </div>
      <Skeleton className="mb-6 h-11 w-full rounded-xl" />
      <SetGridSkeleton />
    </PageContainer>
  );
}
