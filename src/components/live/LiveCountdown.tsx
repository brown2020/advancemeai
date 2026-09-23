"use client";

import { useEffect, useState } from "react";

/** 3-2-1 before the round starts; calls onDone when it reaches zero. */
export function LiveCountdown({ from = 3, onDone }: { from?: number; onDone: () => void }) {
  const [count, setCount] = useState(from);

  useEffect(() => {
    if (count <= 0) {
      onDone();
      return;
    }
    const timer = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [count, onDone]);

  return (
    <div className="flex flex-col items-center py-16 text-center" aria-live="assertive">
      <p className="text-lg font-semibold text-muted-foreground">Get ready!</p>
      <p
        key={count}
        className="mt-4 flex size-40 animate-slide-up items-center justify-center rounded-full bg-primary text-7xl font-bold tabular-nums text-primary-foreground shadow-lift"
      >
        {Math.max(count, 1)}
      </p>
    </div>
  );
}
