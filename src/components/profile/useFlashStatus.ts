"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** A short-lived status message (e.g. "Copied") that clears itself. */
export function useFlashStatus() {
  const [status, setStatus] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setStatus(null);
  }, []);

  const flash = useCallback((message: string, ms = 2500) => {
    if (timer.current) clearTimeout(timer.current);
    setStatus(message);
    timer.current = setTimeout(() => setStatus(null), ms);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { status, flash, clear };
}
