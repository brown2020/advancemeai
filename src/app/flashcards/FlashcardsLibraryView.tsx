"use client";

import { Plus, RefreshCw } from "lucide-react";
import { ROUTES } from "@/constants/appConstants";
import { ActionLink, ErrorDisplay, PageHeader } from "@/components/common/UIComponents";
import { Button } from "@/components/ui/button";
import { LibraryToolbar } from "@/components/flashcards/library/LibraryToolbar";
import { OverviewTab } from "@/components/flashcards/library/OverviewTab";
import { FoldersTab } from "@/components/flashcards/library/FoldersTab";
import { SetGrid } from "@/components/flashcards/library/SetGrid";
import { SetFolderMenu } from "@/components/flashcards/library/SetFolderMenu";
import { SignUpNudge } from "@/components/flashcards/library/SignUpNudge";
import { LibraryEmptyState } from "@/components/flashcards/library/LibraryEmptyState";
import type { LibrarySortKey, LibraryTab } from "@/components/flashcards/library/library-utils";
import type { FlashcardFolder } from "@/types/flashcard-folder";
import type { FlashcardSet } from "@/types/flashcard";
import {
  librarySearchPlaceholder,
  libraryShowsSort,
  queryIsActive,
  yourSetsAreLoading,
  type LibraryViewer,
} from "./flashcards-library-model";

const OVERVIEW_LIMIT = 3;

type FolderActions = {
  createFolder: (name: string) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  addSetToFolder: (folderId: string, setId: string) => Promise<void>;
  removeSetFromFolder: (folderId: string, setId: string) => Promise<void>;
};

type ListEmptyProps = {
  tab: "your" | "starred" | "recent" | "discover";
  query: string;
  onClearQuery: () => void;
  onBrowseDiscover: () => void;
};

export function LibraryPageHeader({ showAuthTabs }: { showAuthTabs: boolean }) {
  return (
    <PageHeader
      title={showAuthTabs ? "Your library" : "Flashcards"}
      description={
        showAuthTabs
          ? undefined
          : "Browse study sets shared by other students, or sign up to make your own."
      }
      actions={showAuthTabs ? <CreateSetLink /> : null}
    />
  );
}

function CreateSetLink() {
  return (
    <ActionLink href={ROUTES.FLASHCARDS.CREATE}>
      <Plus aria-hidden />
      Create set
    </ActionLink>
  );
}

export function LibraryError({ message }: { message: string | null }) {
  if (!message) return null;
  return <ErrorDisplay message={message} />;
}

function LibraryRefreshButton({
  onClick,
  isBusy,
  label,
}: {
  onClick: () => void;
  isBusy: boolean;
  label: string;
}) {
  return (
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
}

function LibraryToolbarTrailing({
  tab,
  recentCount,
  onRefreshYours,
  yoursBusy,
  onRefreshPublic,
  publicBusy,
  onClearRecent,
}: {
  tab: LibraryTab;
  recentCount: number;
  onRefreshYours: () => void;
  yoursBusy: boolean;
  onRefreshPublic: () => void;
  publicBusy: boolean;
  onClearRecent: () => void;
}) {
  if (tab === "your") {
    return (
      <LibraryRefreshButton
        onClick={onRefreshYours}
        isBusy={yoursBusy}
        label="Refresh your flashcard sets"
      />
    );
  }
  if (tab === "discover") {
    return (
      <LibraryRefreshButton
        onClick={onRefreshPublic}
        isBusy={publicBusy}
        label="Refresh public flashcard sets"
      />
    );
  }
  if (tab === "recent" && recentCount > 0) {
    return (
      <Button type="button" variant="ghost" onClick={onClearRecent}>
        Clear
      </Button>
    );
  }
  return null;
}

export function LibraryBrowseToolbar({
  tab,
  query,
  onQueryChange,
  sortKey,
  onSortChange,
  activeFolderId,
  recentCount,
  onRefreshYours,
  yoursBusy,
  onRefreshPublic,
  publicBusy,
  onClearRecent,
}: {
  tab: LibraryTab;
  query: string;
  onQueryChange: (query: string) => void;
  sortKey: LibrarySortKey;
  onSortChange: (sortKey: LibrarySortKey) => void;
  activeFolderId: string | null;
  recentCount: number;
  onRefreshYours: () => void;
  yoursBusy: boolean;
  onRefreshPublic: () => void;
  publicBusy: boolean;
  onClearRecent: () => void;
}) {
  if (tab === "overview") return null;
  return (
    <LibraryToolbar
      query={query}
      onQueryChange={onQueryChange}
      placeholder={librarySearchPlaceholder(tab, activeFolderId)}
      sortKey={sortKey}
      onSortChange={onSortChange}
      showSort={libraryShowsSort(tab, activeFolderId)}
      trailing={
        <LibraryToolbarTrailing
          tab={tab}
          recentCount={recentCount}
          onRefreshYours={onRefreshYours}
          yoursBusy={yoursBusy}
          onRefreshPublic={onRefreshPublic}
          publicBusy={publicBusy}
          onClearRecent={onClearRecent}
        />
      }
    />
  );
}

function SetListEmpty({ tab, query, onClearQuery, onBrowseDiscover }: ListEmptyProps) {
  return (
    <LibraryEmptyState
      tab={tab}
      hasQuery={queryIsActive(query)}
      onClearQuery={onClearQuery}
      onBrowseDiscover={onBrowseDiscover}
    />
  );
}

function OverviewPanel({
  viewerUserId,
  isSignedIn,
  recentSets,
  yourSets,
  publicSets,
  isYourLoading,
  isPublicLoading,
  onNavigate,
}: {
  viewerUserId: string | undefined;
  isSignedIn: boolean;
  recentSets: FlashcardSet[];
  yourSets: FlashcardSet[];
  publicSets: FlashcardSet[];
  isYourLoading: boolean;
  isPublicLoading: boolean;
  onNavigate: (tab: LibraryTab) => void;
}) {
  return (
    <OverviewTab
      viewerUserId={viewerUserId}
      isSignedIn={isSignedIn}
      recentSets={recentSets.slice(0, OVERVIEW_LIMIT)}
      yourSets={yourSets.slice(0, OVERVIEW_LIMIT)}
      publicSets={publicSets.slice(0, OVERVIEW_LIMIT * 2)}
      isYourLoading={isYourLoading}
      isPublicLoading={isPublicLoading}
      onNavigate={onNavigate}
    />
  );
}

function YourSetsPanel({
  sets,
  viewerUserId,
  isYourLoading,
  isAuthLoading,
  user,
  folders,
  onAdd,
  onRemove,
  query,
  onClearQuery,
  onBrowseDiscover,
}: {
  sets: FlashcardSet[];
  viewerUserId: string | undefined;
  isYourLoading: boolean;
  isAuthLoading: boolean;
  user: LibraryViewer;
  folders: FlashcardFolder[];
  onAdd: FolderActions["addSetToFolder"];
  onRemove: FolderActions["removeSetFromFolder"];
  query: string;
  onClearQuery: () => void;
  onBrowseDiscover: () => void;
}) {
  return (
    <SetGrid
      sets={sets}
      viewerUserId={viewerUserId}
      isLoading={yourSetsAreLoading(isYourLoading, isAuthLoading, user)}
      renderActions={(set) => (
        <SetFolderMenu
          setId={set.id}
          setTitle={set.title}
          folders={folders}
          onAdd={onAdd}
          onRemove={onRemove}
        />
      )}
      empty={
        <SetListEmpty
          tab="your"
          query={query}
          onClearQuery={onClearQuery}
          onBrowseDiscover={onBrowseDiscover}
        />
      }
    />
  );
}

function FoldersPanel({
  user,
  folders,
  isLoading,
  activeFolderId,
  onOpenFolder,
  setsById,
  yourSets,
  query,
  sortKey,
  actions,
}: {
  user: LibraryViewer;
  folders: FlashcardFolder[];
  isLoading: boolean;
  activeFolderId: string | null;
  onOpenFolder: (folderId: string | null) => void;
  setsById: Map<string, FlashcardSet>;
  yourSets: FlashcardSet[];
  query: string;
  sortKey: LibrarySortKey;
  actions: FolderActions;
}) {
  if (!user) return null;
  return (
    <FoldersTab
      folders={folders}
      isLoading={isLoading}
      activeFolderId={activeFolderId}
      onOpenFolder={onOpenFolder}
      setsById={setsById}
      yourSets={yourSets}
      viewerUserId={user.uid}
      query={query}
      sortKey={sortKey}
      createFolder={actions.createFolder}
      deleteFolder={actions.deleteFolder}
      addSetToFolder={actions.addSetToFolder}
      removeSetFromFolder={actions.removeSetFromFolder}
    />
  );
}

function CollectedSetsPanel({
  tab,
  sets,
  viewerUserId,
  query,
  onClearQuery,
  onBrowseDiscover,
}: {
  tab: "starred" | "recent";
  sets: FlashcardSet[];
  viewerUserId: string | undefined;
  query: string;
  onClearQuery: () => void;
  onBrowseDiscover: () => void;
}) {
  return (
    <SetGrid
      sets={sets}
      viewerUserId={viewerUserId}
      empty={
        <SetListEmpty
          tab={tab}
          query={query}
          onClearQuery={onClearQuery}
          onBrowseDiscover={onBrowseDiscover}
        />
      }
    />
  );
}

function DiscoverSignUp({
  showAuthTabs,
  isAuthLoading,
}: {
  showAuthTabs: boolean;
  isAuthLoading: boolean;
}) {
  if (showAuthTabs || isAuthLoading) return null;
  return <SignUpNudge />;
}

function DiscoverPanel({
  sets,
  viewerUserId,
  isPublicLoading,
  showAuthTabs,
  isAuthLoading,
  query,
  onClearQuery,
  onBrowseDiscover,
}: {
  sets: FlashcardSet[];
  viewerUserId: string | undefined;
  isPublicLoading: boolean;
  showAuthTabs: boolean;
  isAuthLoading: boolean;
  query: string;
  onClearQuery: () => void;
  onBrowseDiscover: () => void;
}) {
  return (
    <div className="space-y-8">
      <DiscoverSignUp showAuthTabs={showAuthTabs} isAuthLoading={isAuthLoading} />
      <SetGrid
        sets={sets}
        viewerUserId={viewerUserId}
        isLoading={isPublicLoading}
        empty={
          <SetListEmpty
            tab="discover"
            query={query}
            onClearQuery={onClearQuery}
            onBrowseDiscover={onBrowseDiscover}
          />
        }
      />
    </div>
  );
}

export function LibraryTabContent({
  tab,
  user,
  isSignedIn,
  showAuthTabs,
  isAuthLoading,
  viewerUserId,
  visibleSets,
  recentSets,
  sortedYourSets,
  publicSets,
  isYourLoading,
  isPublicLoading,
  folders,
  isFoldersLoading,
  activeFolderId,
  onOpenFolder,
  setsById,
  query,
  sortKey,
  actions,
  onNavigate,
  onClearQuery,
  onBrowseDiscover,
}: {
  tab: LibraryTab;
  user: LibraryViewer;
  isSignedIn: boolean;
  showAuthTabs: boolean;
  isAuthLoading: boolean;
  viewerUserId: string | undefined;
  visibleSets: FlashcardSet[];
  recentSets: FlashcardSet[];
  sortedYourSets: FlashcardSet[];
  publicSets: FlashcardSet[];
  isYourLoading: boolean;
  isPublicLoading: boolean;
  folders: FlashcardFolder[];
  isFoldersLoading: boolean;
  activeFolderId: string | null;
  onOpenFolder: (folderId: string | null) => void;
  setsById: Map<string, FlashcardSet>;
  query: string;
  sortKey: LibrarySortKey;
  actions: FolderActions;
  onNavigate: (tab: LibraryTab) => void;
  onClearQuery: () => void;
  onBrowseDiscover: () => void;
}) {
  switch (tab) {
    case "overview":
      return (
        <OverviewPanel
          viewerUserId={viewerUserId}
          isSignedIn={isSignedIn}
          recentSets={recentSets}
          yourSets={sortedYourSets}
          publicSets={publicSets}
          isYourLoading={isYourLoading}
          isPublicLoading={isPublicLoading}
          onNavigate={onNavigate}
        />
      );
    case "your":
      return (
        <YourSetsPanel
          sets={visibleSets}
          viewerUserId={viewerUserId}
          isYourLoading={isYourLoading}
          isAuthLoading={isAuthLoading}
          user={user}
          folders={folders}
          onAdd={actions.addSetToFolder}
          onRemove={actions.removeSetFromFolder}
          query={query}
          onClearQuery={onClearQuery}
          onBrowseDiscover={onBrowseDiscover}
        />
      );
    case "folders":
      return (
        <FoldersPanel
          user={user}
          folders={folders}
          isLoading={isFoldersLoading}
          activeFolderId={activeFolderId}
          onOpenFolder={onOpenFolder}
          setsById={setsById}
          yourSets={sortedYourSets}
          query={query}
          sortKey={sortKey}
          actions={actions}
        />
      );
    case "starred":
    case "recent":
      return (
        <CollectedSetsPanel
          tab={tab}
          sets={visibleSets}
          viewerUserId={viewerUserId}
          query={query}
          onClearQuery={onClearQuery}
          onBrowseDiscover={onBrowseDiscover}
        />
      );
    case "discover":
      return (
        <DiscoverPanel
          sets={visibleSets}
          viewerUserId={viewerUserId}
          isPublicLoading={isPublicLoading}
          showAuthTabs={showAuthTabs}
          isAuthLoading={isAuthLoading}
          query={query}
          onClearQuery={onClearQuery}
          onBrowseDiscover={onBrowseDiscover}
        />
      );
    default:
      return null;
  }
}
