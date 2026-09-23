"use client";

import { useEffect, useRef } from "react";
import { isTextEntryTarget } from "./study-utils";

/**
 * Number keys 1–9 pick an answer choice while `enabled`.
 * Ignores key presses that come from text fields and dialogs.
 */
export function useChoiceShortcuts(
  enabled: boolean,
  choiceCount: number,
  onPick: (index: number) => void
) {
  const onPickRef = useRef(onPick);
  useEffect(() => {
    onPickRef.current = onPick;
  });

  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTextEntryTarget(e.target)) return;
      const n = Number.parseInt(e.key, 10);
      if (Number.isNaN(n) || n < 1 || n > choiceCount) return;
      e.preventDefault();
      onPickRef.current(n - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [choiceCount, enabled]);
}
