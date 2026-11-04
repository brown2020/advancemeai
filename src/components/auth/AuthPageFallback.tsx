import { LoadingSpinner } from "@/components/ui/spinner";

export function AuthPageFallback({ message }: { message: string }) {
  return (
    <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-6xl items-center px-4 py-8 sm:px-6 md:py-12">
      <div className="grid w-full overflow-hidden rounded-3xl border border-border bg-card shadow-card lg:grid-cols-2">
        <div className="hidden bg-primary lg:block" />
        <div className="flex flex-col items-center justify-center px-5 py-16">
          <LoadingSpinner size="medium" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
}
