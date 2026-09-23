"use client";

import { useState } from "react";
import { Folder, FolderPlus } from "lucide-react";
import type { FlashcardFolder } from "@/types/flashcard-folder";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/utils/cn";
import { ChecklistItem } from "./ChecklistItem";

type SetFolderMenuProps = {
  setId: string;
  setTitle: string;
  folders: FlashcardFolder[];
  onAdd: (folderId: string, setId: string) => Promise<void>;
  onRemove: (folderId: string, setId: string) => Promise<void>;
};

/** Compact icon button that opens a checklist of folders for one set. */
export function SetFolderMenu({
  setId,
  setTitle,
  folders,
  onAdd,
  onRemove,
}: SetFolderMenuProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const inAnyFolder = folders.some((f) => f.setIds.includes(setId));

  const toggle = async (folder: FlashcardFolder) => {
    setPendingId(folder.id);
    try {
      if (folder.setIds.includes(setId)) {
        await onRemove(folder.id, setId);
      } else {
        await onAdd(folder.id, setId);
      }
    } catch {
      // Errors surface through the folders hook's error state.
    } finally {
      setPendingId(null);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Folders for ${setTitle}`}
          title="Add to folder"
          className={cn(inAnyFolder && "text-primary")}
        >
          {inAnyFolder ? <Folder /> : <FolderPlus />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-2">
        <p className="px-2 pb-1.5 pt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Save to folder
        </p>
        {folders.length === 0 ? (
          <p className="px-2 pb-2 text-sm text-muted-foreground">
            No folders yet. Create one from the Folders tab.
          </p>
        ) : (
          <ul className="max-h-64 overflow-y-auto">
            {folders.map((folder) => {
              const checked = folder.setIds.includes(setId);
              return (
                <li key={folder.id}>
                  <ChecklistItem
                    checked={checked}
                    disabled={pendingId !== null}
                    onToggle={() => void toggle(folder)}
                  >
                    {folder.name}
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
