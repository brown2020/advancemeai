"use client";

import { useMemo, useState } from "react";
import { Eye, Search, SearchX, Star } from "lucide-react";
import type { Flashcard } from "@/types/flashcard";
import { cn } from "@/utils/cn";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { EmptyState } from "@/components/common/UIComponents";

type TermsFilter = "all" | "starred";

type TermsListProps = {
  cards: Flashcard[];
  starredCardIds: ReadonlySet<string>;
  onToggleStar: (cardId: string) => void;
  onJumpToCard: (cardId: string) => void;
  /** Optional content on the right of the heading (e.g. progress). */
  aside?: React.ReactNode;
};

export function TermsList({
  cards,
  starredCardIds,
  onToggleStar,
  onJumpToCard,
  aside,
}: TermsListProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TermsFilter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter((c) => {
      if (filter === "starred" && !starredCardIds.has(c.id)) return false;
      if (!q) return true;
      return c.term.toLowerCase().includes(q) || c.definition.toLowerCase().includes(q);
    });
  }, [cards, filter, query, starredCardIds]);

  return (
    <section aria-labelledby="terms-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2 id="terms-heading" className="text-lg font-semibold">
          Terms in this set{" "}
          <span className="font-normal text-muted-foreground tabular-nums">
            ({cards.length})
          </span>
        </h2>
        {aside}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented<TermsFilter>
          label="Filter terms"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All" },
            {
              value: "starred",
              label: (
                <>
                  <Star className="size-3.5" aria-hidden />
                  Starred ({starredCardIds.size})
                </>
              ),
            },
          ]}
        />
        <div className="relative w-full sm:w-72">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search terms"
            className="pl-9"
            aria-label="Search terms"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={filter === "starred" && !query ? <Star /> : <SearchX />}
          title={filter === "starred" && !query ? "No starred terms yet" : "No matches"}
          message={
            filter === "starred" && !query
              ? "Tap the star on any term to save it for focused review."
              : "Try a different search."
          }
          className="py-10"
        />
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((card) => {
            const starred = starredCardIds.has(card.id);
            return (
              <li
                key={card.id}
                className="flex gap-2 rounded-2xl border border-border bg-card p-4 shadow-card sm:gap-4 sm:p-5"
              >
                <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-6">
                  <div className="min-w-0 sm:border-r sm:border-border sm:pr-6">
                    <span className="sr-only">Term: </span>
                    <p className="whitespace-pre-wrap break-words font-semibold">
                      {card.term}
                    </p>
                    {card.termImageUrl ? (
                      <img
                        src={card.termImageUrl}
                        alt=""
                        className="mt-2 max-h-24 rounded-lg object-contain"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <span className="sr-only">Definition: </span>
                    <p className="whitespace-pre-wrap break-words text-muted-foreground sm:text-foreground">
                      {card.definition}
                    </p>
                    {card.definitionImageUrl ? (
                      <img
                        src={card.definitionImageUrl}
                        alt=""
                        className="mt-2 max-h-24 rounded-lg object-contain"
                      />
                    ) : null}
                  </div>
                </div>

                <div className="-my-1 -mr-1 flex shrink-0 flex-col items-center gap-0.5 sm:flex-row">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onToggleStar(card.id)}
                    aria-pressed={starred}
                    aria-label={starred ? `Unstar ${card.term}` : `Star ${card.term}`}
                    className={cn(
                      "rounded-full",
                      starred ? "text-warning hover:text-warning" : "text-muted-foreground"
                    )}
                  >
                    <Star className={cn(starred && "fill-current")} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onJumpToCard(card.id)}
                    aria-label={`Show ${card.term} in flashcards`}
                    className="rounded-full text-muted-foreground"
                  >
                    <Eye />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
