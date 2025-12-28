"use client";

import { useMemo, useState } from "react";
import { Search, Star } from "lucide-react";
import type { Flashcard } from "@/types/flashcard";
import { cn } from "@/utils/cn";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function TermsList({
  cards,
  starredCardIds,
  onToggleStar,
  onJumpToCard,
}: {
  cards: Flashcard[];
  starredCardIds: Set<string>;
  onToggleStar: (cardId: string) => void;
  onJumpToCard: (cardId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [onlyStarred, setOnlyStarred] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter((c) => {
      if (onlyStarred && !starredCardIds.has(c.id)) return false;
      if (!q) return true;
      return (
        c.term.toLowerCase().includes(q) || c.definition.toLowerCase().includes(q)
      );
    });
  }, [cards, onlyStarred, query, starredCardIds]);

  return (
    <section className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h2 className="text-lg font-semibold">Terms</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search terms..."
              className="pl-9 w-full sm:w-[260px]"
              aria-label="Search terms"
            />
          </div>
          <Button
            type="button"
            variant={onlyStarred ? "default" : "outline"}
            size="sm"
            onClick={() => setOnlyStarred((v) => !v)}
            aria-pressed={onlyStarred}
          >
            Starred
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((card, idx) => (
          <div
            key={card.id}
            className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  TERM {idx + 1}
                </div>
                <div className="font-medium whitespace-pre-wrap break-words">
                  {card.term}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">DEFINITION</div>
                <div className="whitespace-pre-wrap break-words">
                  {card.definition}
                </div>
              </div>
            </div>

            <div className="flex gap-2 sm:flex-col sm:items-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onToggleStar(card.id)}
                aria-label={starredCardIds.has(card.id) ? "Unstar term" : "Star term"}
                className={cn(
                  "px-2",
                  starredCardIds.has(card.id) && "text-amber-500 hover:text-amber-600"
                )}
              >
                <Star className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onJumpToCard(card.id)}
              >
                Study
              </Button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6 text-center text-muted-foreground">
            No terms match your filter.
          </div>
        )}
      </div>
    </section>
  );
}


