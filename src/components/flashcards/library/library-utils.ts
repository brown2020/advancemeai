import type { FlashcardSet } from "@/types/flashcard";
import { sortFlashcardSets } from "@/utils/flashcardUtils";

export type LibraryTab =
  | "overview"
  | "your"
  | "folders"
  | "starred"
  | "recent"
  | "discover";

export const LIBRARY_TABS: {
  id: LibraryTab;
  label: string;
  requiresAuth?: boolean;
}[] = [
  { id: "overview", label: "Overview" },
  { id: "your", label: "Your sets", requiresAuth: true },
  { id: "folders", label: "Folders", requiresAuth: true },
  { id: "starred", label: "Starred", requiresAuth: true },
  { id: "recent", label: "Recent" },
  { id: "discover", label: "Discover" },
];

export function isAuthOnlyTab(tab: LibraryTab): boolean {
  return Boolean(LIBRARY_TABS.find((t) => t.id === tab)?.requiresAuth);
}

export type LibrarySortKey = "updated" | "created" | "title" | "terms";

export const LIBRARY_SORT_OPTIONS: { value: LibrarySortKey; label: string }[] = [
  { value: "updated", label: "Recently updated" },
  { value: "created", label: "Recently created" },
  { value: "title", label: "Title (A–Z)" },
  { value: "terms", label: "Most terms" },
];

const SORT_CONFIG: Record<
  LibrarySortKey,
  { sortBy: string; direction: "asc" | "desc" }
> = {
  updated: { sortBy: "updatedAt", direction: "desc" },
  created: { sortBy: "createdAt", direction: "desc" },
  title: { sortBy: "title", direction: "asc" },
  terms: { sortBy: "cardCount", direction: "desc" },
};

/** Maps the persisted flashcard settings sort field onto a library sort key. */
export function sortKeyFromSettings(sortBy: string): LibrarySortKey {
  switch (sortBy) {
    case "createdAt":
      return "created";
    case "title":
      return "title";
    case "cardCount":
      return "terms";
    default:
      return "updated";
  }
}

export function sortSets(
  sets: FlashcardSet[],
  sortKey: LibrarySortKey
): FlashcardSet[] {
  const { sortBy, direction } = SORT_CONFIG[sortKey];
  return sortFlashcardSets(sets, sortBy, direction);
}

/** Minimum query length before terms/definitions are searched too. */
const CARD_SEARCH_MIN_LENGTH = 3;

/**
 * Filters sets by a free-text query. Title and description always match;
 * card terms/definitions are searched once the query has 3+ characters.
 */
export function filterSetsByQuery(
  sets: FlashcardSet[],
  query: string
): FlashcardSet[] {
  const q = query.trim().toLowerCase();
  if (!q) return sets;
  const searchCards = q.length >= CARD_SEARCH_MIN_LENGTH;

  return sets.filter((s) => {
    if (
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    ) {
      return true;
    }
    if (!searchCards) return false;
    return s.cards.some(
      (c) =>
        c.term.toLowerCase().includes(q) ||
        c.definition.toLowerCase().includes(q)
    );
  });
}

/** Builds an id → set lookup; earlier lists win when ids collide. */
export function indexSetsById(
  ...lists: FlashcardSet[][]
): Map<string, FlashcardSet> {
  const map = new Map<string, FlashcardSet>();
  for (const list of lists) {
    for (const s of list) {
      if (!map.has(s.id)) map.set(s.id, s);
    }
  }
  return map;
}

/** Resolves ids to sets in id order, skipping unknown ids. */
export function pickSetsByIds(
  ids: Iterable<string>,
  byId: Map<string, FlashcardSet>
): FlashcardSet[] {
  const result: FlashcardSet[] = [];
  for (const id of ids) {
    const set = byId.get(id);
    if (set) result.push(set);
  }
  return result;
}

export function formatShortDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
