"use client";

import { useFlashcardFolders } from "@/hooks/useFlashcardFolders";
import { Button } from "@/components/ui/button";
import { FolderPlus } from "lucide-react";
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

  if (isLoading && folders.length === 0) {
    return null;
  }

  if (folders.length === 0) {
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>
        Create a folder from your library to organize sets.
      </p>
    );
  }

  const containingFolders = folders.filter((f) => f.setIds.includes(setId));

  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={`add-folder-${setId}`}
        className="text-sm font-medium flex items-center gap-1.5"
      >
        <FolderPlus className="h-4 w-4" aria-hidden />
        Add to folder
      </label>
      <select
        id={`add-folder-${setId}`}
        className={cn(
          "h-9 w-full max-w-xs rounded-xl border border-input bg-background px-3 text-sm",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        )}
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
      </select>
      {containingFolders.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {containingFolders.map((f) => (
            <Button
              key={f.id}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void removeSetFromFolder(f.id, setId)}
            >
              Remove from {f.name}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
