"use client";

import { useMemo } from "react";
import { ChevronRight, Folder, FolderPlus } from "lucide-react";
import type { FlashcardSet } from "@/types/flashcard";
import type { FlashcardFolder } from "@/types/flashcard-folder";
import { CardGrid, EmptyState } from "@/components/common/UIComponents";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateFolderForm } from "./CreateFolderForm";
import { FolderDetail } from "./FolderDetail";
import type { LibrarySortKey } from "./library-utils";

type FoldersTabProps = {
  folders: FlashcardFolder[];
  isLoading: boolean;
  activeFolderId: string | null;
  onOpenFolder: (folderId: string | null) => void;
  setsById: Map<string, FlashcardSet>;
  yourSets: FlashcardSet[];
  viewerUserId: string;
  query: string;
  sortKey: LibrarySortKey;
  createFolder: (name: string) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  addSetToFolder: (folderId: string, setId: string) => Promise<void>;
  removeSetFromFolder: (folderId: string, setId: string) => Promise<void>;
};

export function FoldersTab({
  folders,
  isLoading,
  activeFolderId,
  onOpenFolder,
  setsById,
  yourSets,
  viewerUserId,
  query,
  sortKey,
  createFolder,
  deleteFolder,
  addSetToFolder,
  removeSetFromFolder,
}: FoldersTabProps) {
  const activeFolder = activeFolderId
    ? (folders.find((f) => f.id === activeFolderId) ?? null)
    : null;

  const visibleFolders = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return folders;
    return folders.filter((f) => f.name.toLowerCase().includes(q));
  }, [folders, query]);

  if (activeFolder) {
    return (
      <FolderDetail
        folder={activeFolder}
        setsById={setsById}
        yourSets={yourSets}
        viewerUserId={viewerUserId}
        query={query}
        sortKey={sortKey}
        onBack={() => onOpenFolder(null)}
        onDelete={async () => {
          await deleteFolder(activeFolder.id);
          onOpenFolder(null);
        }}
        onAddSet={addSetToFolder}
        onRemoveSet={removeSetFromFolder}
      />
    );
  }

  return (
    <div className="space-y-6">
      <CreateFolderForm onCreate={createFolder} />

      {isLoading && folders.length === 0 ? (
        <CardGrid>
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-[76px] rounded-2xl" />
          ))}
        </CardGrid>
      ) : folders.length === 0 ? (
        <EmptyState
          icon={<FolderPlus />}
          title="No folders yet"
          message="Folders group related sets, like one per class or unit. Name your first one above."
        />
      ) : visibleFolders.length === 0 ? (
        <EmptyState title="No matching folders" message="Try a different search." />
      ) : (
        <CardGrid>
          {visibleFolders.map((folder) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              onOpen={() => onOpenFolder(folder.id)}
            />
          ))}
        </CardGrid>
      )}
    </div>
  );
}

function FolderCard({
  folder,
  onOpen,
}: {
  folder: FlashcardFolder;
  onOpen: () => void;
}) {
  const count = folder.setIds.length;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-card transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
        <Folder className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{folder.name}</span>
        <span className="block text-sm text-muted-foreground tabular-nums">
          {count} {count === 1 ? "set" : "sets"}
        </span>
      </span>
      <ChevronRight
        className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </button>
  );
}
