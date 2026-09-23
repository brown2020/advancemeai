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
      title="We couldn't load your profile"
      description="Something went wrong while loading your account settings. Try again in a moment."
    />
  );
}
