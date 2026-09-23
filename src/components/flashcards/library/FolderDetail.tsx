"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, FolderMinus, FolderOpen, Plus } from "lucide-react";
import type { FlashcardSet } from "@/types/flashcard";
import type { FlashcardFolder } from "@/types/flashcard-folder";
import { EmptyState } from "@/components/common/UIComponents";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChecklistItem } from "./ChecklistItem";
import { SetGrid } from "./SetGrid";
import { DeleteFolderDialog } from "./DeleteFolderDialog";
import {
  filterSetsByQuery,
  pickSetsByIds,
  sortSets,
  type LibrarySortKey,
} from "./library-utils";

type FolderDetailProps = {
  folder: FlashcardFolder;
  setsById: Map<string, FlashcardSet>;
  yourSets: FlashcardSet[];
  viewerUserId: string;
  query: string;
  sortKey: LibrarySortKey;
  onBack: () => void;
  onDelete: () => Promise<void>;
  onAddSet: (folderId: string, setId: string) => Promise<void>;
  onRemoveSet: (folderId: string, setId: string) => Promise<void>;
};

export function FolderDetail({
  folder,
  setsById,
  yourSets,
  viewerUserId,
  query,
  sortKey,
  onBack,
  onDelete,
  onAddSet,
  onRemoveSet,
}: FolderDetailProps) {
  const knownSets = useMemo(
    () => pickSetsByIds(folder.setIds, setsById),
    [folder.setIds, setsById]
  );
  const unknownSetIds = useMemo(
    () => folder.setIds.filter((id) => !setsById.has(id)),
    [folder.setIds, setsById]
  );
  const visibleSets = useMemo(
    () => sortSets(filterSetsByQuery(knownSets, query), sortKey),
    [knownSets, query, sortKey]
  );

  const count = folder.setIds.length;

  return (
    <div className="animate-fade-in">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="-ml-2 mb-3 text-muted-foreground"
      >
        <ArrowLeft aria-hidden />
        All folders
      </Button>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
            <FolderOpen className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold">{folder.name}</h2>
            <p className="text-sm text-muted-foreground tabular-nums">
              {count} {count === 1 ? "set" : "sets"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <AddSetsMenu
            folder={folder}
            yourSets={yourSets}
            onAdd={onAddSet}
            onRemove={onRemoveSet}
          />
          <DeleteFolderDialog folderName={folder.name} onConfirm={onDelete} />
        </div>
      </div>

      {count === 0 ? (
        <EmptyState
          icon={<FolderOpen />}
          title="This folder is empty"
          message="Use “Add sets” to put some of your sets in here."
        />
      ) : (
        <div className="space-y-4">
          <SetGrid
            sets={visibleSets}
            viewerUserId={viewerUserId}
            empty={
              knownSets.length > 0 ? (
                <EmptyState
                  title="No matching sets"
                  message="Try a different search."
                />
              ) : null
            }
            renderActions={(set) => (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => void onRemoveSet(folder.id, set.id)}
                aria-label={`Remove ${set.title} from ${folder.name}`}
                title="Remove from folder"
              >
                <FolderMinus />
              </Button>
            )}
          />

          {unknownSetIds.length > 0 && (
            <ul className="divide-y divide-border rounded-2xl border border-dashed border-border bg-card/50">
              {unknownSetIds.map((setId) => (
                <li
                  key={setId}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Unavailable set</p>
                    <p className="truncate text-xs text-muted-foreground">
                      It may have been deleted or made private.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => void onRemoveSet(folder.id, setId)}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

type AddSetsMenuProps = {
  folder: FlashcardFolder;
  yourSets: FlashcardSet[];
  onAdd: (folderId: string, setId: string) => Promise<void>;
  onRemove: (folderId: string, setId: string) => Promise<void>;
};

/** Popover checklist of the user's sets for quickly filling a folder. */
function AddSetsMenu({ folder, yourSets, onAdd, onRemove }: AddSetsMenuProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);

  const toggle = async (setId: string, inFolder: boolean) => {
    setPendingId(setId);
    try {
      if (inFolder) await onRemove(folder.id, setId);
      else await onAdd(folder.id, setId);
    } catch {
      // Errors surface through the folders hook's error state.
    } finally {
      setPendingId(null);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Plus aria-hidden />
          Add sets
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-2">
        <p className="px-2 pb-1.5 pt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Your sets
        </p>
        {yourSets.length === 0 ? (
          <p className="px-2 pb-2 text-sm text-muted-foreground">
            You don&apos;t have any sets yet.
          </p>
        ) : (
          <ul className="max-h-72 overflow-y-auto">
            {yourSets.map((set) => {
              const inFolder = folder.setIds.includes(set.id);
              return (
                <li key={set.id}>
                  <ChecklistItem
                    checked={inFolder}
                    disabled={pendingId !== null}
                    onToggle={() => void toggle(set.id, inFolder)}
                    trailing={set.cards.length}
                  >
                    {set.title}
                  </ChecklistItem>
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
