"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LIBRARY_SORT_OPTIONS, type LibrarySortKey } from "./library-utils";

type LibraryToolbarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder?: string;
  sortKey: LibrarySortKey;
  onSortChange: (value: LibrarySortKey) => void;
  /** Recent keeps its own recency order, so sorting can be hidden. */
  showSort?: boolean;
  /** Trailing controls such as refresh/clear. */
  trailing?: React.ReactNode;
};

export function LibraryToolbar({
  query,
  onQueryChange,
  placeholder = "Search sets and terms",
  sortKey,
  onSortChange,
  showSort = true,
  trailing,
}: LibraryToolbarProps) {
  return (
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          aria-label="Filter sets"
          className="pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            aria-label="Clear filter"
            className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {showSort && (
          <Select
            value={sortKey}
            onChange={(e) => onSortChange(e.target.value as LibrarySortKey)}
            aria-label="Sort sets"
            className="flex-1 sm:w-48 sm:flex-none"
          >
            {LIBRARY_SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        )}
        {trailing}
      </div>
    </div>
  );
}
