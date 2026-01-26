"use client";

import { useEffect } from "react";
import { logger } from "@/utils/logger";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error boundary for the application
 * Catches errors during rendering and provides recovery mechanism
 */
export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    logger.error("Application error caught by error boundary:", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-md text-center">
        <h2 className="mb-4 text-2xl font-bold">Something went wrong!</h2>
        <p className="mb-6 text-muted-foreground">
          We encountered an unexpected error. Please try again or contact
          support if the problem persists.
        </p>
        {error.digest && (
          <p className="mb-6 text-sm text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
