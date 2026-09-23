"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { logger } from "@/utils/logger";
import { cn } from "@/utils/cn";

interface RouteErrorStateProps {
  error: Error & { digest?: string };
  reset: () => void;
  /** Headline, e.g. "We couldn't load your profile". */
  title?: string;
  /** Friendly explanation shown under the title. */
  description?: string;
  /** Where the secondary action goes. Defaults to home. */
  homeHref?: string;
  homeLabel?: string;
  className?: string;
}

/**
 * Friendly, on-brand error screen for route-level `error.tsx` boundaries.
 * Logs the error once and offers "Try again" and "Go home" actions.
 */
export function RouteErrorState({
  error,
  reset,
  title = "Something went wrong",
  description = "We hit an unexpected snag loading this page. Give it another try — your progress is safe.",
  homeHref = "/",
  homeLabel = "Go home",
  className,
}: RouteErrorStateProps) {
  useEffect(() => {
    logger.error("Route error caught by error boundary:", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div
      className={cn(
        "mx-auto flex min-h-[60svh] w-full max-w-lg flex-col items-center justify-center px-4 py-16 text-center animate-fade-in",
        className
      )}
      role="alert"
    >
      <div className="mb-6 flex size-16 items-center justify-center rounded-3xl bg-destructive/10 text-destructive">
        <TriangleAlert className="size-8" aria-hidden />
      </div>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-3 text-muted-foreground">{description}</p>
      <div className="mt-8 flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row">
        <Link href={homeHref} className={buttonVariants({ variant: "outline", size: "lg" })}>
          <Home aria-hidden />
          {homeLabel}
        </Link>
        <Button type="button" size="lg" onClick={reset}>
          <RotateCcw aria-hidden />
          Try again
        </Button>
      </div>
      {error.digest && (
        <p className="mt-8 font-mono text-xs text-muted-foreground">
          Error ID: {error.digest}
        </p>
      )}
    </div>
  );
}
