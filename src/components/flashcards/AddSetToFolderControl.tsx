"use client";

import { FolderPlus, X } from "lucide-react";
import { useFlashcardFolders } from "@/hooks/useFlashcardFolders";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/cn";

type AddSetToFolderControlProps = {
  userId: string;
  setId: string;
  className?: string;
};

export function AddSetToFolderControl({
  userId,
  setId,
  className,
}: AddSetToFolderControlProps) {
  const { folders, addSetToFolder, removeSetFromFolder, isLoading } =
    useFlashcardFolders(userId);

  const labelId = `add-folder-${setId}`;

  if (isLoading && folders.length === 0) {
    return <Skeleton className={cn("h-16 w-full rounded-xl", className)} />;
  }

  if (folders.length === 0) {
    return (
      <p className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <FolderPlus className="size-4 shrink-0" aria-hidden />
        Create a folder from your library to organize sets.
      </p>
    );
  }

  const containingFolders = folders.filter((f) => f.setIds.includes(setId));

  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={labelId} className="flex items-center gap-2 text-sm font-semibold">
        <FolderPlus className="size-4 text-primary" aria-hidden />
        Add to folder
      </label>
      <Select
        id={labelId}
        defaultValue=""
        onChange={(e) => {
          const folderId = e.target.value;
          if (!folderId) return;
          void addSetToFolder(folderId, setId);
          e.currentTarget.value = "";
        }}
      >
        <option value="">Choose a folder…</option>
        {folders.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </Select>
      {containingFolders.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="Folders containing this set">
          {containingFolders.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => void removeSetFromFolder(f.id, setId)}
                className="inline-flex h-8 items-center gap-1 rounded-full bg-accent pl-3 pr-2 text-xs font-semibold text-accent-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Remove from ${f.name}`}
              >
                {f.name}
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
