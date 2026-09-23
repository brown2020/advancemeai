"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type DeleteFolderDialogProps = {
  folderName: string;
  onConfirm: () => Promise<void>;
};

/** "Delete folder" button guarded by a confirmation dialog. Sets are kept. */
export function DeleteFolderDialog({
  folderName,
  onConfirm,
}: DeleteFolderDialogProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      setOpen(false);
    } catch {
      // Errors surface through the folders hook's error state.
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isDeleting && setOpen(next)}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-destructive hover:border-destructive/40 hover:bg-destructive/10"
        >
          <Trash2 aria-hidden />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete &ldquo;{folderName}&rdquo;?</DialogTitle>
          <DialogDescription>
            The folder will be removed. The sets inside it stay in your
            library.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void handleConfirm()}
            isLoading={isDeleting}
          >
            Delete folder
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
