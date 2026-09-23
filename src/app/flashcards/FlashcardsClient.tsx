"use client";

import { useMemo, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useUserFlashcards } from "@/hooks/useFlashcards";
import { useFlashcardSettings } from "@/hooks/useFlashcardSettings";
import { usePublicFlashcards } from "@/hooks/usePublicFlashcards";
import { useFlashcardFolders } from "@/hooks/useFlashcardFolders";
import { useFlashcardStudyStore } from "@/stores/flashcard-study-store";
import { useFlashcardLibraryStore } from "@/stores/flashcard-library-store";
import { ROUTES } from "@/constants/appConstants";
import {
  ActionLink,
  ErrorDisplay,
  PageContainer,
  PageHeader,
} from "@/components/common/UIComponents";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { LibraryToolbar } from "@/components/flashcards/library/LibraryToolbar";
import { OverviewTab } from "@/components/flashcards/library/OverviewTab";
import { FoldersTab } from "@/components/flashcards/library/FoldersTab";
import { SetGrid } from "@/components/flashcards/library/SetGrid";
import { SetFolderMenu } from "@/components/flashcards/library/SetFolderMenu";
import { SignUpNudge } from "@/components/flashcards/library/SignUpNudge";
import { LibraryEmptyState } from "@/components/flashcards/library/LibraryEmptyState";
import { useHydrateLibraryProgress } from "@/components/flashcards/library/useHydrateLibraryProgress";
import {
  LIBRARY_TABS,
  filterSetsByQuery,
  indexSetsById,
  isAuthOnlyTab,
  pickSetsByIds,
  sortKeyFromSettings,
  sortSets,
  type LibrarySortKey,
  type LibraryTab,
} from "@/components/flashcards/library/library-utils";
import type { FlashcardFolder } from "@/types/flashcard-folder";
import type { FlashcardSet } from "@/types/flashcard";

type FlashcardsClientProps = {
  authIsGuaranteed?: boolean;
  initialPublicSets?: FlashcardSet[];
  initialYourSets?: FlashcardSet[];
  initialFolders?: FlashcardFolder[];
};

const OVERVIEW_LIMIT = 3;

export default function FlashcardsClient({
  authIsGuaranteed = false,
  initialPublicSets,
  initialYourSets,
  initialFolders,
}: FlashcardsClientProps) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { settings } = useFlashcardSettings();
  const starredBySetId = useFlashcardStudyStore((s) => s.starredBySetId);
  const recentSetIds = useFlashcardLibraryStore((s) => s.recentSetIds);
  const clearRecent = useFlashcardLibraryStore((s) => s.clearRecent);

  // `null` means "use the default tab for the current auth state".
  const [selectedTab, setSelectedTab] = useState<LibraryTab | null>(null);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<LibrarySortKey>(() =>
    sortKeyFromSettings(settings.sortBy)
  );
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  const {
    sets: publicSets,
    isLoading: isPublicLoading,
    error: publicError,
    refresh: refreshPublic,
  } = usePublicFlashcards({ initialSets: initialPublicSets });

  const {
    sets: yourSets,
    isLoading: isYourLoading,
    error: yourError,
    refreshData: refreshYour,
  } = useUserFlashcards({
    refreshInterval: user && settings.autoRefresh ? settings.refreshInterval : 0,
    prefetchSets: settings.prefetchSets,
    // Only hydrate initial signed-in data when server verified auth.
    initialSets: authIsGuaranteed ? initialYourSets : undefined,
  });

  const {
    folders,
    isLoading: isFoldersLoading,
    error: foldersError,
    createFolder,
    deleteFolder,
    addSetToFolder,
    removeSetFromFolder,
  } = useFlashcardFolders(user?.uid ?? null, {
    initialFolders: authIsGuaranteed ? initialFolders : undefined,
  });

  useHydrateLibraryProgress(user?.uid);

  const isSignedIn = Boolean(user);
  // While auth resolves, trust the server's verdict so signed-in users don't see a flash.
  const showAuthTabs = isSignedIn || (isAuthLoading && authIsGuaranteed);
  const defaultTab: LibraryTab = showAuthTabs ? "overview" : "discover";
  const requestedTab = selectedTab ?? defaultTab;
  const tab: LibraryTab =
    isAuthOnlyTab(requestedTab) && !showAuthTabs ? "discover" : requestedTab;

  const tabOptions = useMemo(
    () =>
      LIBRARY_TABS.filter((t) => !t.requiresAuth || showAuthTabs).map((t) => ({
        value: t.id,
        label: t.label,
      })),
    [showAuthTabs]
  );

  const signedInYourSets = useMemo(
    () => (user ? yourSets : []),
    [user, yourSets]
  );

  const setsById = useMemo(
    () => indexSetsById(signedInYourSets, publicSets),
    [publicSets, signedInYourSets]
  );

  const sortedYourSets = useMemo(
    () => sortSets(signedInYourSets, sortKey),
    [signedInYourSets, sortKey]
  );

  const recentSets = useMemo(
    () => pickSetsByIds(recentSetIds, setsById),
    [recentSetIds, setsById]
  );

  const starredSets = useMemo(() => {
    const ids = Object.entries(starredBySetId)
      .filter(([, cards]) => Object.keys(cards ?? {}).length > 0)
      .map(([setId]) => setId);
    return pickSetsByIds(ids, setsById);
  }, [setsById, starredBySetId]);

  const visibleSets = useMemo(() => {
    switch (tab) {
      case "your":
        return filterSetsByQuery(sortedYourSets, query);
      case "starred":
        return sortSets(filterSetsByQuery(starredSets, query), sortKey);
      case "recent":
        return filterSetsByQuery(recentSets, query);
      case "discover":
        return sortSets(filterSetsByQuery(publicSets, query), sortKey);
      default:
        return [];
    }
  }, [publicSets, query, recentSets, sortKey, sortedYourSets, starredSets, tab]);

  const changeTab = (next: LibraryTab) => {
    setSelectedTab(next);
    setActiveFolderId(null);
  };

  const error = yourError || publicError || foldersError;
  const viewerUserId = user?.uid;
  const emptyStateFor = (listTab: "your" | "starred" | "recent" | "discover") => (
    <LibraryEmptyState
      tab={listTab}
      hasQuery={query.trim().length > 0}
      onClearQuery={() => setQuery("")}
      onBrowseDiscover={() => changeTab("discover")}
    />
  );

  const refreshButton = (onClick: () => void, isBusy: boolean, label: string) => (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={onClick}
      disabled={isBusy}
      aria-label={label}
      title="Refresh"
    >
      <RefreshCw className={isBusy ? "animate-spin" : undefined} aria-hidden />
    </Button>
  );

  const toolbarTrailing =
    tab === "your"
      ? refreshButton(refreshYour, isYourLoading, "Refresh your flashcard sets")
      : tab === "discover"
        ? refreshButton(refreshPublic, isPublicLoading, "Refresh public flashcard sets")
        : tab === "recent" && recentSetIds.length > 0
          ? (
              <Button type="button" variant="ghost" onClick={clearRecent}>
                Clear
              </Button>
            )
          : null;

  return (
    <PageContainer>
      <PageHeader
        title={showAuthTabs ? "Your library" : "Flashcards"}
        description={
          showAuthTabs
            ? undefined
            : "Browse study sets shared by other students, or sign up to make your own."
        }
        actions={
          showAuthTabs ? (
            <ActionLink href={ROUTES.FLASHCARDS.CREATE}>
              <Plus aria-hidden />
              Create set
            </ActionLink>
          ) : null
        }
      />

      <Segmented
        label="Library sections"
        value={tab}
        onChange={changeTab}
        options={tabOptions}
        className="mb-5"
      />

      {error && <ErrorDisplay message={error} />}

      {tab !== "overview" && (
        <LibraryToolbar
          query={query}
          onQueryChange={setQuery}
          placeholder={
            tab === "folders"
              ? activeFolderId
                ? "Search this folder"
                : "Search folders"
              : tab === "discover"
                ? "Search public sets and terms"
                : "Search sets and terms"
          }
          sortKey={sortKey}
          onSortChange={setSortKey}
          showSort={tab !== "recent" && !(tab === "folders" && !activeFolderId)}
          trailing={toolbarTrailing}
        />
      )}

      {tab === "overview" && (
        <OverviewTab
          viewerUserId={viewerUserId}
          isSignedIn={isSignedIn}
          recentSets={recentSets.slice(0, OVERVIEW_LIMIT)}
          yourSets={sortedYourSets.slice(0, OVERVIEW_LIMIT)}
          publicSets={publicSets.slice(0, OVERVIEW_LIMIT * 2)}
          isYourLoading={isYourLoading}
          isPublicLoading={isPublicLoading}
          onNavigate={changeTab}
        />
      )}

      {tab === "your" && (
        <SetGrid
          sets={visibleSets}
          viewerUserId={viewerUserId}
          isLoading={isYourLoading || (isAuthLoading && !user)}
          renderActions={(set) => (
            <SetFolderMenu
              setId={set.id}
              setTitle={set.title}
              folders={folders}
              onAdd={addSetToFolder}
              onRemove={removeSetFromFolder}
            />
          )}
          empty={emptyStateFor("your")}
        />
      )}

      {tab === "folders" && user && (
        <FoldersTab
          folders={folders}
          isLoading={isFoldersLoading}
          activeFolderId={activeFolderId}
          onOpenFolder={setActiveFolderId}
          setsById={setsById}
          yourSets={sortedYourSets}
          viewerUserId={user.uid}
          query={query}
          sortKey={sortKey}
          createFolder={createFolder}
          deleteFolder={deleteFolder}
          addSetToFolder={addSetToFolder}
          removeSetFromFolder={removeSetFromFolder}
        />
      )}

      {(tab === "starred" || tab === "recent") && (
        <SetGrid
          sets={visibleSets}
          viewerUserId={viewerUserId}
          empty={emptyStateFor(tab)}
        />
      )}

      {tab === "discover" && (
        <div className="space-y-8">
          {!showAuthTabs && !isAuthLoading && <SignUpNudge />}
          <SetGrid
            sets={visibleSets}
            viewerUserId={viewerUserId}
            isLoading={isPublicLoading}
            empty={emptyStateFor("discover")}
          />
        </div>
      )}
    </PageContainer>
  );
}
