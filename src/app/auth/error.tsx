"use client";

import { RouteErrorState } from "@/components/common/RouteErrorState";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorState
      error={error}
      reset={reset}
      title="Sign-in hit a snag"
      description="We couldn't load this page. Try again, or head home and sign in from there."
    />
  );
}
