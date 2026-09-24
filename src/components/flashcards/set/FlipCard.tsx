"use client";

import { useRef } from "react";
import { cn } from "@/utils/cn";

type FlipCardFace = {
  label: string;
  text: string;
  imageUrl?: string;
};

type FlipCardProps = {
  front: FlipCardFace;
  back: FlipCardFace;
  isFlipped: boolean;
  onFlip: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  size?: "default" | "large";
};

const SWIPE_THRESHOLD_PX = 50;

function textSizeClass(text: string, hasImage: boolean) {
  const len = text.length;
  if (hasImage || len > 160) return "text-base sm:text-lg";
  if (len > 60) return "text-lg sm:text-2xl";
  return "text-2xl sm:text-4xl";
}

function Face({
  face,
  hidden,
  isBack,
}: {
  face: FlipCardFace;
  hidden: boolean;
  isBack?: boolean;
}) {
  return (
    <span
      aria-hidden={hidden}
      className={cn(
        "backface-hidden absolute inset-0 flex flex-col rounded-3xl border border-border bg-card p-5 shadow-card sm:p-8",
        isBack && "rotate-y-180"
      )}
    >
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {face.label}
      </span>
      <span className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-y-auto py-3 text-center">
        {face.imageUrl ? (
          <img
            src={face.imageUrl}
            alt=""
            className="max-h-[45%] w-auto max-w-full rounded-xl object-contain"
          />
        ) : null}
        {face.text ? (
          <span
            className={cn(
              "whitespace-pre-wrap break-words font-semibold leading-snug",
              textSizeClass(face.text, Boolean(face.imageUrl))
            )}
          >
            {face.text}
          </span>
        ) : null}
      </span>
      <span className="text-center text-xs text-muted-foreground">
        Tap to flip
      </span>
    </span>
  );
}

/**
 * Two-sided card with a 3D flip (instant when reduced motion is preferred).
 * Supports tap/click, keyboard (it's a button) and horizontal swipes.
 */
export function FlipCard({
  front,
  back,
  isFlipped,
  onFlip,
  onSwipeLeft,
  onSwipeRight,
  size = "default",
}: FlipCardProps) {
  const touchStartX = useRef<number | null>(null);
  const didSwipe = useRef(false);

  return (
    <button
      type="button"
      onClick={() => {
        if (didSwipe.current) {
          didSwipe.current = false;
          return;
        }
        onFlip();
      }}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
        didSwipe.current = false;
      }}
      onTouchEnd={(e) => {
        const start = touchStartX.current;
        const end = e.changedTouches[0]?.clientX;
        touchStartX.current = null;
        if (start === null || end === undefined) return;
        const dx = end - start;
        if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
        didSwipe.current = true;
        if (dx < 0) onSwipeLeft?.();
        else onSwipeRight?.();
      }}
      aria-label={`${isFlipped ? back.label : front.label}: ${
        isFlipped ? back.text : front.text
      }. Activate to flip.`}
      className={cn(
        "perspective relative block w-full rounded-3xl text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background",
        size === "large"
          ? "aspect-[3/4] max-h-[70svh] sm:aspect-[16/10]"
          : "aspect-[4/5] max-h-[60svh] sm:aspect-[16/10]"
      )}
    >
      <span
        className={cn(
          "preserve-3d relative block h-full w-full transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none",
          isFlipped && "rotate-y-180"
        )}
      >
        <Face face={front} hidden={isFlipped} />
        <Face face={back} hidden={!isFlipped} isBack />
      </span>
    </button>
  );
}
