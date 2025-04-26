"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Flashcard } from "@/models/flashcard";
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

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      handleFlip();
      e.preventDefault();
    } else if (e.key === "ArrowRight" && onNext && !isLast) {
      onNext();
    } else if (e.key === "ArrowLeft" && onPrevious && !isFirst) {
      onPrevious();
    }
  };

  return (
    <div className="flex flex-col items-center">
      {currentIndex !== undefined && totalCards !== undefined && (
        <div className="mb-4 text-center">
          <span className="text-gray-600 dark:text-gray-300">
            Card {currentIndex + 1} of {totalCards}
          </span>
        </div>
      )}

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
          {isFlipped ? (
            <div className="transition-transform duration-500">
              <h2 className="text-2xl font-bold mb-2">
                {flashcard.definition}
              </h2>
              <p className="text-gray-500 text-sm mt-4">Click to see term</p>
            </div>
          ) : (
            <div className="transition-transform duration-500">
              <h2 className="text-2xl font-bold mb-2">{flashcard.term}</h2>
              <p className="text-gray-500 text-sm mt-4">
                Click to see definition
              </p>
            </div>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}
