"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, MoreHorizontal, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ROUTES } from "@/constants/appConstants";
import { cn } from "@/utils/cn";

type SetActionsMenuProps = {
  setId: string;
  isOwner: boolean;
  /** Only offered when there's progress to reset. */
  onResetProgress?: () => void;
};

const itemClass = cn(
  "flex h-11 w-full items-center gap-3 rounded-lg px-2.5 text-left text-sm font-medium transition-colors",
  "hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
);

/** Overflow ("…") menu with less common set actions. */
export function SetActionsMenu({ setId, isOwner, onResetProgress }: SetActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);

  if (!isOwner && !onResetProgress) return null;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setConfirmingReset(false);
      }}
    >
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label="More actions">
          <MoreHorizontal />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-1.5">
        {confirmingReset ? (
          <div className="p-2">
            <p className="text-sm font-semibold">Reset your progress?</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Mastery for every term in this set goes back to zero.
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirmingReset(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  onResetProgress?.();
                  setOpen(false);
                  setConfirmingReset(false);
                }}
              >
                Reset
              </Button>
            </div>
          </div>
        ) : (
          <ul>
            {isOwner ? (
              <li>
                <Link
                  href={ROUTES.FLASHCARDS.EDIT(setId)}
                  className={itemClass}
                  onClick={() => setOpen(false)}
                >
                  <Eye className="size-4 text-muted-foreground" aria-hidden />
                  Change visibility
                </Link>
              </li>
            ) : null}
            {onResetProgress ? (
              <li>
                <button
                  type="button"
                  className={cn(itemClass, "text-destructive")}
                  onClick={() => setConfirmingReset(true)}
                >
                  <RotateCcw className="size-4" aria-hidden />
                  Reset progress
                </button>
              </li>
            ) : null}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
