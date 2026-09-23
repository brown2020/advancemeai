import { Skeleton } from "@/components/ui/skeleton";

/** Placeholder layout for the set page while the set loads. */
export function SetPageSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 md:py-10"
      aria-busy="true"
      aria-label="Loading flashcard set"
    >
      <Skeleton className="mb-4 h-5 w-28" />
      <Skeleton className="h-9 w-2/3 max-w-md" />
      <Skeleton className="mt-3 h-4 w-48" />
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-16 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="mx-auto mt-8 aspect-[4/5] max-h-[60svh] w-full max-w-3xl rounded-3xl sm:aspect-[16/10]" />
    </div>
  );
}
