import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-6xl items-center px-4 py-8 sm:px-6 md:py-12">
      <div
        className="grid w-full overflow-hidden rounded-3xl border border-border bg-card shadow-card lg:grid-cols-2"
        aria-busy="true"
      >
        <span className="sr-only">Loading…</span>
        <div className="hidden bg-primary lg:block" />
        <div className="mx-auto w-full max-w-sm space-y-4 px-5 py-12">
          <Skeleton className="h-9 w-3/4 rounded-xl" />
          <Skeleton className="h-4 w-1/2 rounded-lg" />
          <Skeleton className="mt-6 h-12 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
