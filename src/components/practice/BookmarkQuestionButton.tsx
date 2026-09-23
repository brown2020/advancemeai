"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSpacedRepetitionStore } from "@/stores/spaced-repetition-store";
import { cn } from "@/utils/cn";

type BookmarkProps = {
  questionId: string;
  questionText: string;
  correctAnswer: string;
  sectionId: string;
};

/** Saves the question to spaced-repetition bookmarks for later review. */
export function BookmarkQuestionButton({
  questionId,
  questionText,
  correctAnswer,
  sectionId,
}: BookmarkProps) {
  const addBookmark = useSpacedRepetitionStore((state) => state.addBookmark);
  const isBookmarked = useSpacedRepetitionStore((state) =>
    state.bookmarks.some((bookmark) => bookmark.id === questionId)
  );

  const handleBookmark = () => {
    addBookmark({
      id: questionId,
      front: questionText,
      back: correctAnswer,
      sectionId,
      addedAt: Date.now(),
    });
  };

  const Icon = isBookmarked ? BookmarkCheck : Bookmark;

  return (
    <Button
      type="button"
      onClick={handleBookmark}
      variant="ghost"
      size="sm"
      aria-pressed={isBookmarked}
      aria-label={isBookmarked ? "Bookmarked for review" : "Bookmark for review"}
      className={cn(isBookmarked && "text-primary")}
    >
      <Icon className={cn(isBookmarked && "fill-primary/15")} aria-hidden />
      <span className="hidden sm:inline">
        {isBookmarked ? "Bookmarked" : "Bookmark"}
      </span>
    </Button>
  );
}
