"use client";

import { Check } from "lucide-react";
import { cn } from "@/utils/cn";

export type MatchCard = {
  id: string;
  cardId: string;
  type: "term" | "definition";
  content: string;
  imageUrl?: string;
  isMatched: boolean;
  isSelected: boolean;
  isWrong: boolean;
};

/** One selectable tile on the Match board. */
export function MatchTile({
  card,
  onSelect,
}: {
  card: MatchCard;
  onSelect: () => void;
}) {
  const state = card.isMatched
    ? "matched"
    : card.isWrong
      ? "wrong"
      : card.isSelected
        ? "selected"
        : "idle";

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={card.isMatched}
      aria-pressed={card.isSelected}
      aria-label={
        card.isMatched ? `${card.content} (matched)` : undefined
      }
      className={cn(
        "relative flex min-h-16 w-full items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-sm transition-[border-color,background-color,opacity,transform] duration-200 sm:text-base",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        state === "idle" &&
          "border-border bg-card shadow-card hover:border-primary/40 hover:bg-accent/40",
        state === "selected" && "border-primary bg-accent ring-2 ring-primary/30",
        state === "wrong" &&
          "border-destructive bg-destructive/10 motion-safe:animate-shake",
        state === "matched" &&
          "cursor-default border-success/40 bg-success/10 text-success opacity-60 motion-safe:scale-[0.98]"
      )}
    >
      {card.imageUrl ? (
        <img
          src={card.imageUrl}
          alt=""
          className="size-10 shrink-0 rounded-md object-cover"
        />
      ) : null}
      <span className="line-clamp-4 min-w-0 flex-1 whitespace-pre-wrap break-words">
        {card.content}
      </span>
      {state === "matched" ? (
        <Check className="size-4 shrink-0" aria-hidden />
      ) : null}
    </button>
  );
}
