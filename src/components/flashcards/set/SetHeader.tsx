"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  FolderPlus,
  Globe,
  Layers,
  Link as LinkIcon,
  Lock,
  Pencil,
} from "lucide-react";
import type { FlashcardSet } from "@/types/flashcard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ShareModal } from "@/components/sharing/ShareModal";
import { AddSetToFolderControl } from "@/components/flashcards/AddSetToFolderControl";
import { AddSetToClassControl } from "@/components/flashcards/AddSetToClassControl";
import { ROUTES } from "@/constants/appConstants";
import { VISIBILITY_LABELS, normalizeVisibility } from "@/lib/flashcard-visibility";
import { SetActionsMenu } from "./SetActionsMenu";
import type { SetAuthor } from "./useSetAuthor";

const VISIBILITY_ICONS = {
  public: Globe,
  unlisted: LinkIcon,
  private: Lock,
} as const;

type SetHeaderProps = {
  set: FlashcardSet;
  author: SetAuthor | null;
  userId: string | null;
  isOwner: boolean;
  canCopy: boolean;
  isCopying: boolean;
  onCopy: () => void;
  onResetProgress?: () => void;
};

export function SetHeader({
  set,
  author,
  userId,
  isOwner,
  canCopy,
  isCopying,
  onCopy,
  onResetProgress,
}: SetHeaderProps) {
  const visibility = normalizeVisibility({
    visibility: set.visibility,
    isPublic: set.isPublic,
  });
  const VisibilityIcon = VISIBILITY_ICONS[visibility];
  const authorName = isOwner ? "You" : author?.name;

  return (
    <header className="mb-8">
      <Link
        href={ROUTES.FLASHCARDS.INDEX}
        className="mb-4 inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Flashcards
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">
            {set.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {authorName ? (
              <span className="inline-flex items-center gap-2">
                <span
                  className="flex size-6 items-center justify-center rounded-full bg-accent text-xs font-semibold text-primary"
                  aria-hidden
                >
                  {authorName.charAt(0).toUpperCase()}
                </span>
                <span>
                  <span className="sr-only">Created by </span>
                  {!isOwner && author?.username ? (
                    <Link
                      href={`/users/${encodeURIComponent(author.username)}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {authorName}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground">{authorName}</span>
                  )}
                </span>
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <Layers className="size-4" aria-hidden />
              {set.cards.length} {set.cards.length === 1 ? "term" : "terms"}
            </span>
            <Badge variant="outline">
              <VisibilityIcon aria-hidden />
              {VISIBILITY_LABELS[visibility]}
            </Badge>
          </div>

          {set.description ? (
            <p className="mt-3 line-clamp-3 max-w-2xl whitespace-pre-wrap break-words text-muted-foreground">
              {set.description}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:justify-end">
          <ShareModal title={set.title} url={`/flashcards/${set.id}`} />

          {isOwner ? (
            <Link
              href={ROUTES.FLASHCARDS.EDIT(set.id)}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Pencil aria-hidden />
              Edit
            </Link>
          ) : null}

          {canCopy ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCopy}
              isLoading={isCopying}
              disabled={!userId}
            >
              {isCopying ? null : <Copy aria-hidden />}
              {isCopying ? "Copying…" : "Make a copy"}
            </Button>
          ) : null}

          {isOwner && userId ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <FolderPlus aria-hidden />
                  Add to…
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 space-y-5">
                <AddSetToFolderControl userId={userId} setId={set.id} />
                <div className="border-t border-border pt-4">
                  <AddSetToClassControl userId={userId} setId={set.id} />
                </div>
              </PopoverContent>
            </Popover>
          ) : null}

          <SetActionsMenu
            setId={set.id}
            isOwner={isOwner}
            onResetProgress={onResetProgress}
          />
        </div>
      </div>
    </header>
  );
}
