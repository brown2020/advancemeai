"use client";

import { env } from "@/config/env";

/** Prefer passing `testParam` from a Server Component page's searchParams. */
export function useTestMode(testParam?: string | null): boolean {
  if (typeof testParam === "string") {
    return env.allowTestMode && testParam === "true";
  }
  if (typeof window === "undefined") return false;
  try {
    return (
      env.allowTestMode &&
      new URLSearchParams(window.location.search).get("test") === "true"
    );
  } catch {
    return false;
  }
}
