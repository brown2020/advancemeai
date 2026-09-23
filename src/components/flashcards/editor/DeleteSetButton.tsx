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

interface DeleteSetButtonProps {
  /** Delete the set. Resolve with an error message to show it, or nothing on success. */
  onDelete: () => Promise<string | void>;
}

/** Icon button that confirms before permanently deleting a set. */
export function DeleteSetButton({ onDelete }: DeleteSetButtonProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    setIsDeleting(true);
    const message = await onDelete();
    if (message) {
      setError(message);
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isDeleting) return;
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Delete set"
          title="Delete set"
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this set?</DialogTitle>
          <DialogDescription>
            This permanently deletes the set and all of its cards. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isDeleting}>
            Keep set
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} isLoading={isDeleting}>
            {isDeleting ? "Deleting…" : "Delete set"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
