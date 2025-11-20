"use client";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";
import { useSpacedRepetitionStore } from "@/stores/spaced-repetition-store";

type BookmarkProps = {
  questionId: string;
  questionText: string;
  correctAnswer: string;
  sectionId: string;
};

export function BookmarkQuestionButton({
  questionId,
  questionText,
  correctAnswer,
  sectionId,
}: BookmarkProps) {
  const addBookmark = useSpacedRepetitionStore((state) => state.addBookmark);

  const handleBookmark = () => {
    addBookmark({
      id: questionId,
      front: questionText,
      back: correctAnswer,
      sectionId,
      addedAt: Date.now(),
    });
  };

  return (
    <Button
      onClick={handleBookmark}
      variant="ghost"
      size="sm"
      className="gap-2"
    >
      <Bookmark className="h-4 w-4" />
      Bookmark
    </Button>
  );
}

