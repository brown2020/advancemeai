"use client";

import { Clock, Compass, Layers, Star } from "lucide-react";
import { ROUTES } from "@/constants/appConstants";
import { EmptyState } from "@/components/common/UIComponents";
import { Button } from "@/components/ui/button";
import type { LibraryTab } from "./library-utils";

type LibraryEmptyStateProps = {
  tab: Exclude<LibraryTab, "overview" | "folders">;
  hasQuery: boolean;
  onClearQuery: () => void;
  onBrowseDiscover: () => void;
};

/** Empty state for a set list tab: "no matches" while filtering, otherwise a tab-specific nudge. */
export function LibraryEmptyState({
  tab,
  hasQuery,
  onClearQuery,
  onBrowseDiscover,
}: LibraryEmptyStateProps) {
  if (hasQuery) {
    return (
      <EmptyState
        title="No matching sets"
        message="Try a different search. Terms and definitions are searched once you type 3+ characters."
        action={
          <Button type="button" variant="outline" onClick={onClearQuery}>
            Clear search
          </Button>
        }
      />
    );
  }

  switch (tab) {
    case "your":
      return (
        <EmptyState
          icon={<Layers />}
          title="Your library is empty"
          message="Create a set from scratch, or copy one from Discover to study and edit it."
          actionLink={ROUTES.FLASHCARDS.CREATE}
          actionText="Create a set"
        />
      );
    case "starred":
      return (
        <EmptyState
          icon={<Star />}
          title="No starred terms yet"
          message="Tap the star on a tricky term while studying and its set will show up here."
        />
      );
    case "recent":
      return (
        <EmptyState
          icon={<Clock />}
          title="Nothing studied yet"
          message="Sets you open will appear here so you can jump back in."
          action={
            <Button type="button" variant="outline" onClick={onBrowseDiscover}>
              Browse Discover
            </Button>
          }
        />
      );
    case "discover":
      return (
        <EmptyState
          icon={<Compass />}
          title="No public sets yet"
          message="Public sets shared by the community will show up here."
        />
      );
  }
}
