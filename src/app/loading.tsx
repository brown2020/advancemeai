import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/common/UIComponents";

/** App-wide loading state: a calm page skeleton instead of a spinner. */
export default function Loading() {
  return (
    <PageContainer>
      <div aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading…</span>
        <Skeleton className="mb-3 h-4 w-24 rounded-full" />
        <Skeleton className="mb-3 h-9 w-2/3 max-w-sm rounded-xl" />
        <Skeleton className="mb-10 h-5 w-full max-w-md rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
