import type { FlashcardSet } from "@/types/flashcard";
import {
  LIBRARY_TABS,
  filterSetsByQuery,
  isAuthOnlyTab,
  sortSets,
  type LibrarySortKey,
  type LibraryTab,
} from "@/components/flashcards/library/library-utils";

export type LibraryViewer = { uid: string } | null;

type TabDefinition = (typeof LIBRARY_TABS)[number];

function tabIsVisible(tab: TabDefinition, showAuthTabs: boolean): boolean {
  return !tab.requiresAuth || showAuthTabs;
}

/** Tabs the segmented control should offer for the current auth state. */
export function visibleLibraryTabOptions(showAuthTabs: boolean) {
  return LIBRARY_TABS.filter((tab) => tabIsVisible(tab, showAuthTabs)).map((tab) => ({
    value: tab.id,
    label: tab.label,
  }));
}

export function resolveLibraryTab(input: {
  user: LibraryViewer;
  isAuthLoading: boolean;
  authIsGuaranteed: boolean;
  selectedTab: LibraryTab | null;
}): { showAuthTabs: boolean; tab: LibraryTab } {
  const isSignedIn = Boolean(input.user);
  const showAuthTabs = isSignedIn || (input.isAuthLoading && input.authIsGuaranteed);
  const defaultTab: LibraryTab = showAuthTabs ? "overview" : "discover";
  const requestedTab = input.selectedTab ?? defaultTab;
  const tab: LibraryTab =
    isAuthOnlyTab(requestedTab) && !showAuthTabs ? "discover" : requestedTab;
  return { showAuthTabs, tab };
}

/** Folder queries are keyed by uid; signed-out viewers pass null. */
export function folderOwnerId(user: LibraryViewer): string | null {
  return user?.uid ?? null;
}

export function libraryRefreshInterval(
  user: LibraryViewer,
  autoRefresh: boolean,
  refreshInterval: number
): number {
  if (user && autoRefresh) return refreshInterval;
  return 0;
}

/** Server-prefetched rows are only safe to hydrate after auth was verified. */
export function whenAuthIsGuaranteed<T>(
  authIsGuaranteed: boolean,
  value: T | undefined
): T | undefined {
  if (!authIsGuaranteed) return undefined;
  return value;
}

export function setsOwnedByViewer(user: LibraryViewer, sets: FlashcardSet[]): FlashcardSet[] {
  if (!user) return [];
  return sets;
}

function hasStarredCards(cards: Readonly<Record<string, true>> | undefined): boolean {
  return Object.keys(cards ?? {}).length > 0;
}

export function starredSetIdList(
  starredBySetId: Readonly<Record<string, Readonly<Record<string, true>> | undefined>>
): string[] {
  return Object.entries(starredBySetId)
    .filter((entry) => hasStarredCards(entry[1]))
    .map(([setId]) => setId);
}

export function selectVisibleSets(input: {
  tab: LibraryTab;
  query: string;
  sortKey: LibrarySortKey;
  sortedYourSets: FlashcardSet[];
  starredSets: FlashcardSet[];
  recentSets: FlashcardSet[];
  publicSets: FlashcardSet[];
}): FlashcardSet[] {
  switch (input.tab) {
    case "your":
      return filterSetsByQuery(input.sortedYourSets, input.query);
    case "starred":
      return sortSets(filterSetsByQuery(input.starredSets, input.query), input.sortKey);
    case "recent":
      return filterSetsByQuery(input.recentSets, input.query);
    case "discover":
      return sortSets(filterSetsByQuery(input.publicSets, input.query), input.sortKey);
    default:
      return [];
  }
}

export function firstLibraryError(
  yourError: string | null,
  publicError: string | null,
  foldersError: string | null
): string | null {
  return yourError || publicError || foldersError;
}

export function yourSetsAreLoading(
  isYourLoading: boolean,
  isAuthLoading: boolean,
  user: LibraryViewer
): boolean {
  return isYourLoading || (isAuthLoading && !user);
}

export function librarySearchPlaceholder(
  tab: LibraryTab,
  activeFolderId: string | null
): string {
  if (tab === "folders") {
    if (activeFolderId) return "Search this folder";
    return "Search folders";
  }
  if (tab === "discover") return "Search public sets and terms";
  return "Search sets and terms";
}

export function libraryShowsSort(tab: LibraryTab, activeFolderId: string | null): boolean {
  if (tab === "recent") return false;
  if (tab === "folders" && !activeFolderId) return false;
  return true;
}

export function queryIsActive(query: string): boolean {
  return query.trim().length > 0;
}
