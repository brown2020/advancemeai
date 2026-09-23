"use client";

import { useEffect, useState } from "react";

/**
 * Counts down once per second from `totalSeconds`. Restarts whenever
 * `totalSeconds` changes; returns null when no timer is active.
 */
export function useCountdown(totalSeconds: number | null): number | null {
  const [state, setState] = useState({
    total: totalSeconds,
    remaining: totalSeconds,
  });

  // Reset synchronously when a new timer is started.
  if (state.total !== totalSeconds) {
    setState({ total: totalSeconds, remaining: totalSeconds });
  }

  useEffect(() => {
    if (totalSeconds === null) return;
    const interval = setInterval(() => {
      setState((prev) =>
        prev.remaining === null || prev.remaining <= 0
          ? prev
          : { ...prev, remaining: prev.remaining - 1 }
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [totalSeconds]);

  return state.total === totalSeconds ? state.remaining : totalSeconds;
}
