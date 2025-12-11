"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flashcard } from "@/types/flashcard";
import { cn } from "@/utils/cn";

interface FlashcardCardProps {
  flashcard: Flashcard;
  onNext?: () => void;
  onPrevious?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  currentIndex?: number;
  totalCards?: number;
}

export function FlashcardCard({
  flashcard,
  onNext,
  onPrevious,
  isFirst = false,
  isLast = false,
  currentIndex,
  totalCards,
}: FlashcardCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        handleFlip();
        e.preventDefault();
      } else if (e.key === "ArrowRight" && onNext && !isLast) {
        onNext();
      } else if (e.key === "ArrowLeft" && onPrevious && !isFirst) {
        onPrevious();
      }
    },
    [handleFlip, onNext, onPrevious, isLast, isFirst]
  );

  // Extract counter component
  const CardCounter = useCallback(() => {
    if (currentIndex === undefined || totalCards === undefined) {
      return null;
    }

    return (
      <div className="mb-4 text-center">
        <span className="text-gray-600 dark:text-gray-300">
          Card {currentIndex + 1} of {totalCards}
        </span>
      </div>
    );
  }, [currentIndex, totalCards]);

  // Extract card content component
  const CardFace = useCallback(
    ({ isBack = false }: { isBack?: boolean }) => (
      <div className="transition-transform duration-500">
        <h2 className="text-2xl font-bold mb-2">
          {isBack ? flashcard.definition : flashcard.term}
        </h2>
        <p className="text-gray-500 text-sm mt-4">
          Click to see {isBack ? "term" : "definition"}
        </p>
      </div>
    ),
    [flashcard]
  );

  // Extract navigation buttons
  const NavigationButtons = useCallback(
    () => (
      <div className="flex justify-between w-full max-w-2xl mt-6">
        <Button
          variant="secondary"
          onClick={onPrevious}
          disabled={isFirst || !onPrevious}
          aria-label="Previous card"
        >
          Previous
        </Button>
        <Button
          onClick={onNext}
          disabled={isLast || !onNext}
          aria-label="Next card"
        >
          Next
        </Button>
      </div>
    ),
    [onPrevious, onNext, isFirst, isLast]
  );

  return (
    <div className="flex flex-col items-center">
      <CardCounter />

      <Card
        className={cn(
          "w-full max-w-2xl min-h-[300px] flex items-center justify-center cursor-pointer transition-transform duration-500 transform hover:scale-105",
          isFlipped ? "bg-blue-50 dark:bg-gray-700" : ""
        )}
        onClick={handleFlip}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`Flashcard: ${isFlipped ? "definition" : "term"}`}
        style={{ perspective: "1000px" }}
      >
        <CardContent className="w-full text-center">
          <CardFace isBack={isFlipped} />
        </CardContent>
      </Card>

      <NavigationButtons />
    </div>
  );
}
