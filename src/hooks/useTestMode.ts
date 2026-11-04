"use client";

import { useSyncExternalStore } from "react";
import { env } from "@/config/env";

function subscribeToLocation(): () => void {
  return () => {};
}

function testParamFromLocation(): boolean {
  try {
    return new URLSearchParams(window.location.search).get("test") === "true";
  } catch {
    return false;
  }
}

/** Prefer passing `testParam` from a Server Component page's searchParams. */
export function useTestMode(testParam?: string | null): boolean {
  const fromLocation = useSyncExternalStore(
    subscribeToLocation,
    testParamFromLocation,
    () => false
  );
  const enabled =
    typeof testParam === "string" ? testParam === "true" : fromLocation;
  return env.allowTestMode && enabled;
}
