"use client";

import { RouteErrorState } from "@/components/common/RouteErrorState";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/** App-wide error boundary (renders inside the app shell). */
export default function Error({ error, reset }: ErrorProps) {
  return <RouteErrorState error={error} reset={reset} />;
}
