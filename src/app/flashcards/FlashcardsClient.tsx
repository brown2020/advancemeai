"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useUserFlashcards } from "@/hooks/useFlashcards";
import { useFlashcardSettings } from "@/hooks/useFlashcardSettings";
import { usePublicFlashcards } from "@/hooks/usePublicFlashcards";
import { useFlashcardFolders } from "@/hooks/useFlashcardFolders";
import { useFlashcardStudyStore } from "@/stores/flashcard-study-store";
import { useFlashcardLibraryStore } from "@/stores/flashcard-library-store";
import { PageContainer } from "@/components/common/UIComponents";
import { Segmented } from "@/components/ui/segmented";
import { useHydrateLibraryProgress } from "@/components/flashcards/library/useHydrateLibraryProgress";
import {
  indexSetsById,
  pickSetsByIds,
  sortKeyFromSettings,
  sortSets,
  type LibrarySortKey,
  type LibraryTab,
} from "@/components/flashcards/library/library-utils";
import type { FlashcardFolder } from "@/types/flashcard-folder";
import type { FlashcardSet } from "@/types/flashcard";
import {
  firstLibraryError,
  folderOwnerId,
  libraryRefreshInterval,
  resolveLibraryTab,
  selectVisibleSets,
  setsOwnedByViewer,
  starredSetIdList,
  visibleLibraryTabOptions,
  whenAuthIsGuaranteed,
} from "./flashcards-library-model";
import {
  LibraryBrowseToolbar,
  LibraryError,
  LibraryPageHeader,
  LibraryTabContent,
} from "./FlashcardsLibraryView";

type FlashcardsClientProps = {
  authIsGuaranteed?: boolean;
  initialPublicSets?: FlashcardSet[];
  initialYourSets?: FlashcardSet[];
  initialFolders?: FlashcardFolder[];
};

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

  const { showAuthTabs, tab } = resolveLibraryTab({
    user,
    isAuthLoading,
    authIsGuaranteed,
    selectedTab,
  });

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
    refreshInterval: libraryRefreshInterval(
      user,
      settings.autoRefresh,
      settings.refreshInterval
    ),
    prefetchSets: settings.prefetchSets,
    // Only hydrate initial signed-in data when server verified auth.
    initialSets: whenAuthIsGuaranteed(authIsGuaranteed, initialYourSets),
  });

  const {
    folders,
    isLoading: isFoldersLoading,
    error: foldersError,
    createFolder,
    deleteFolder,
    addSetToFolder,
    removeSetFromFolder,
  } = useFlashcardFolders(folderOwnerId(user), {
    initialFolders: whenAuthIsGuaranteed(authIsGuaranteed, initialFolders),
  });

  useHydrateLibraryProgress(user?.uid);

  const tabOptions = useMemo(
    () => visibleLibraryTabOptions(showAuthTabs),
    [showAuthTabs]
  );

  const signedInYourSets = useMemo(
    () => setsOwnedByViewer(user, yourSets),
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

  const starredSets = useMemo(
    () => pickSetsByIds(starredSetIdList(starredBySetId), setsById),
    [setsById, starredBySetId]
  );

  const visibleSets = useMemo(
    () =>
      selectVisibleSets({
        tab,
        query,
        sortKey,
        sortedYourSets,
        starredSets,
        recentSets,
        publicSets,
      }),
    [publicSets, query, recentSets, sortKey, sortedYourSets, starredSets, tab]
  );

  const changeTab = (next: LibraryTab) => {
    setSelectedTab(next);
    setActiveFolderId(null);
  };

  const clearQuery = () => setQuery("");
  const browseDiscover = () => changeTab("discover");
  const viewerUserId = user?.uid;
  const isSignedIn = Boolean(user);

  return (
    <PageContainer>
      <LibraryPageHeader showAuthTabs={showAuthTabs} />

      <Segmented
        label="Library sections"
        value={tab}
        onChange={changeTab}
        options={tabOptions}
        className="mb-5"
      />

      <LibraryError message={firstLibraryError(yourError, publicError, foldersError)} />

      <LibraryBrowseToolbar
        tab={tab}
        query={query}
        onQueryChange={setQuery}
        sortKey={sortKey}
        onSortChange={setSortKey}
        activeFolderId={activeFolderId}
        recentCount={recentSetIds.length}
        onRefreshYours={refreshYour}
        yoursBusy={isYourLoading}
        onRefreshPublic={refreshPublic}
        publicBusy={isPublicLoading}
        onClearRecent={clearRecent}
      />

      <LibraryTabContent
        tab={tab}
        user={user}
        isSignedIn={isSignedIn}
        showAuthTabs={showAuthTabs}
        isAuthLoading={isAuthLoading}
        viewerUserId={viewerUserId}
        visibleSets={visibleSets}
        recentSets={recentSets}
        sortedYourSets={sortedYourSets}
        publicSets={publicSets}
        isYourLoading={isYourLoading}
        isPublicLoading={isPublicLoading}
        folders={folders}
        isFoldersLoading={isFoldersLoading}
        activeFolderId={activeFolderId}
        onOpenFolder={setActiveFolderId}
        setsById={setsById}
        query={query}
        sortKey={sortKey}
        actions={{ createFolder, deleteFolder, addSetToFolder, removeSetFromFolder }}
        onNavigate={changeTab}
        onClearQuery={clearQuery}
        onBrowseDiscover={browseDiscover}
      />
    </PageContainer>
  );
}
