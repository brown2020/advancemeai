"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Flashcard } from "@/types/flashcard";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Trophy, Clock, RotateCcw, Zap, Star } from "lucide-react";

interface MatchItem {
  id: string;
  content: string;
  cardId: string;
  type: "term" | "definition";
  isMatched: boolean;
  isSelected: boolean;
}

interface MatchGameProps {
  cards: Flashcard[];
  pairCount?: number;
  onComplete?: (time: number, mistakes: number) => void;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}

export function MatchGame({
  cards,
  pairCount = 6,
  onComplete,
}: MatchGameProps) {
  const [items, setItems] = useState<MatchItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isShaking, setIsShaking] = useState<string | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("matchGame_bestTime");
      return stored ? parseInt(stored, 10) : null;
    }
    return null;
  });

  // Initialize the game
  const initializeGame = useCallback(() => {
    const selectedCards = shuffleArray(cards).slice(
      0,
      Math.min(pairCount, cards.length)
    );

    const terms: MatchItem[] = selectedCards.map((card, i) => ({
      id: `term-${i}`,
      content: card.term,
      cardId: card.id,
      type: "term",
      isMatched: false,
      isSelected: false,
    }));

    const definitions: MatchItem[] = selectedCards.map((card, i) => ({
      id: `def-${i}`,
      content: card.definition,
      cardId: card.id,
      type: "definition",
      isMatched: false,
      isSelected: false,
    }));

    // Shuffle both arrays separately for better distribution
    setItems([...shuffleArray(terms), ...shuffleArray(definitions)]);
    setSelectedId(null);
    setMistakes(0);
    setStartTime(null);
    setEndTime(null);
    setElapsed(0);
  }, [cards, pairCount]);

  // Initialize on mount
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Timer effect
  useEffect(() => {
    if (!startTime || endTime) return;

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 100) / 10);
    }, 100);

    return () => clearInterval(interval);
  }, [startTime, endTime]);

  // Check if game is complete
  const isComplete = useMemo(() => {
    return items.length > 0 && items.every((item) => item.isMatched);
  }, [items]);

  // Handle completion
  useEffect(() => {
    if (isComplete && startTime && !endTime) {
      const finalTime = Date.now() - startTime;
      setEndTime(Date.now());

      // Save best time
      if (!bestTime || finalTime < bestTime) {
        setBestTime(finalTime);
        if (typeof window !== "undefined") {
          localStorage.setItem("matchGame_bestTime", finalTime.toString());
        }
      }

      onComplete?.(finalTime, mistakes);
    }
  }, [isComplete, startTime, endTime, mistakes, bestTime, onComplete]);

  const handleItemClick = (item: MatchItem) => {
    if (item.isMatched) return;

    // Start timer on first click
    if (!startTime) {
      setStartTime(Date.now());
    }

    // If nothing selected, select this item
    if (!selectedId) {
      setSelectedId(item.id);
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, isSelected: true }
            : { ...i, isSelected: false }
        )
      );
      return;
    }

    // If clicking same item, deselect
    if (selectedId === item.id) {
      setSelectedId(null);
      setItems((prev) => prev.map((i) => ({ ...i, isSelected: false })));
      return;
    }

    const selectedItem = items.find((i) => i.id === selectedId);
    if (!selectedItem) return;

    // Check if it's a match (same card, different type)
    if (
      selectedItem.cardId === item.cardId &&
      selectedItem.type !== item.type
    ) {
      // Match found!
      setItems((prev) =>
        prev.map((i) =>
          i.cardId === item.cardId
            ? { ...i, isMatched: true, isSelected: false }
            : { ...i, isSelected: false }
        )
      );
      setSelectedId(null);
    } else {
      // No match
      setMistakes((m) => m + 1);
      setIsShaking(item.id);

      // Brief shake animation
      setTimeout(() => {
        setIsShaking(null);
        setSelectedId(null);
        setItems((prev) => prev.map((i) => ({ ...i, isSelected: false })));
      }, 300);
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const tenths = Math.floor((ms % 1000) / 100);
    return `${seconds}.${tenths}`;
  };

  // Split items into terms and definitions for two columns
  const terms = items.filter((i) => i.type === "term");
  const definitions = items.filter((i) => i.type === "definition");

  if (cards.length < 2) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Need at least 2 cards to play Match.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-lg font-mono">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <span>{elapsed.toFixed(1)}s</span>
          </div>
          {mistakes > 0 && (
            <div className="text-sm text-muted-foreground">
              {mistakes} {mistakes === 1 ? "mistake" : "mistakes"}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {bestTime && (
            <div className="flex items-center gap-1 text-sm text-amber-500">
              <Star className="h-4 w-4" />
              Best: {formatTime(bestTime)}s
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={initializeGame}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Restart
          </Button>
        </div>
      </div>

      {/* Game board */}
      {!isComplete ? (
        <div className="grid grid-cols-2 gap-4">
          {/* Terms column */}
          <div className="space-y-2">
            {terms.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                disabled={item.isMatched}
                className={cn(
                  "w-full p-4 rounded-lg border-2 text-left transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  item.isMatched
                    ? "opacity-0 pointer-events-none"
                    : item.isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/50 hover:bg-muted/50",
                  isShaking === item.id &&
                    "animate-shake border-destructive bg-destructive/10"
                )}
              >
                <span className="text-sm font-medium line-clamp-2">
                  {item.content}
                </span>
              </button>
            ))}
          </div>

          {/* Definitions column */}
          <div className="space-y-2">
            {definitions.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                disabled={item.isMatched}
                className={cn(
                  "w-full p-4 rounded-lg border-2 text-left transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  item.isMatched
                    ? "opacity-0 pointer-events-none"
                    : item.isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/50 hover:bg-muted/50",
                  isShaking === item.id &&
                    "animate-shake border-destructive bg-destructive/10"
                )}
              >
                <span className="text-sm font-medium line-clamp-2">
                  {item.content}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Completion screen */
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Trophy className="h-8 w-8 text-primary" />
          </div>

          <h2 className="text-2xl font-bold mb-2">Great job!</h2>

          <div className="flex items-center justify-center gap-6 text-lg mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="font-mono">
                {formatTime(endTime! - startTime!)}s
              </span>
            </div>
            {mistakes === 0 && (
              <div className="flex items-center gap-2 text-amber-500">
                <Zap className="h-5 w-5" />
                <span>Perfect!</span>
              </div>
            )}
          </div>

          {bestTime &&
            endTime &&
            startTime &&
            endTime - startTime <= bestTime && (
              <div className="flex items-center justify-center gap-2 text-amber-500 mb-4">
                <Star className="h-5 w-5" />
                <span className="font-medium">New best time!</span>
              </div>
            )}

          <div className="text-sm text-muted-foreground mb-6">
            {mistakes === 0
              ? "You matched all pairs without any mistakes!"
              : `You made ${mistakes} ${
                  mistakes === 1 ? "mistake" : "mistakes"
                }.`}
          </div>

          <Button
            type="button"
            onClick={initializeGame}
            className="min-w-[120px]"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Play Again
          </Button>
        </div>
      )}

      {/* Instructions */}
      {!isComplete && !startTime && (
        <div className="text-center text-sm text-muted-foreground">
          Click a term, then click its matching definition. Race to match all
          pairs!
        </div>
      )}
    </div>
  );
}
