"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { Flashcard } from "@/types/flashcard";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { shuffle } from "./study-utils";
import { useGamification } from "@/hooks/useGamification";
import { StreakCounter, XPBadge } from "@/components/gamification";
import { Timer, Trophy, RotateCcw } from "lucide-react";

type Difficulty = "easy" | "medium" | "hard";
type GamePhase = "setup" | "playing" | "complete";

type MatchCard = {
  id: string;
  cardId: string;
  type: "term" | "definition";
  content: string;
  isMatched: boolean;
  isSelected: boolean;
  isWrong: boolean;
};

const DIFFICULTY_CONFIG: Record<Difficulty, { pairs: number; label: string }> = {
  easy: { pairs: 6, label: "Easy (6 pairs)" },
  medium: { pairs: 9, label: "Medium (9 pairs)" },
  hard: { pairs: 12, label: "Hard (12 pairs)" },
};

export function MatchMode({ cards }: { cards: Flashcard[] }) {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [gamePhase, setGamePhase] = useState<GamePhase>("setup");
  const [matchCards, setMatchCards] = useState<MatchCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<MatchCard | null>(null);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);

  // Gamification
  const { xp, level, currentStreak, recordSessionComplete, awardXP } = useGamification();
  const sessionStartTime = useRef<number>(0);

  const totalPairs = DIFFICULTY_CONFIG[difficulty].pairs;

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gamePhase === "playing") {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gamePhase]);

  // Load best time from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`match-best-time-${difficulty}`);
    if (saved) {
      setBestTime(parseInt(saved, 10));
    }
  }, [difficulty]);

  const initializeGame = useCallback(() => {
    const numPairs = Math.min(DIFFICULTY_CONFIG[difficulty].pairs, cards.length);
    const selectedCards = shuffle(cards).slice(0, numPairs);

    // Create term and definition cards
    const termCards: MatchCard[] = selectedCards.map((card) => ({
      id: `term-${card.id}`,
      cardId: card.id,
      type: "term",
      content: card.term,
      isMatched: false,
      isSelected: false,
      isWrong: false,
    }));

    const defCards: MatchCard[] = selectedCards.map((card) => ({
      id: `def-${card.id}`,
      cardId: card.id,
      type: "definition",
      content: card.definition,
      isMatched: false,
      isSelected: false,
      isWrong: false,
    }));

    // Shuffle each column separately
    setMatchCards([...shuffle(termCards), ...shuffle(defCards)]);
    setSelectedCard(null);
    setMatchedPairs(0);
    setMistakes(0);
    setElapsedTime(0);
    setGamePhase("playing");
    sessionStartTime.current = Date.now();
  }, [cards, difficulty]);

  const handleCardClick = useCallback(
    (card: MatchCard) => {
      if (card.isMatched || card.isWrong) return;

      if (!selectedCard) {
        // First selection
        setSelectedCard(card);
        setMatchCards((prev) =>
          prev.map((c) =>
            c.id === card.id ? { ...c, isSelected: true } : c
          )
        );
      } else if (selectedCard.id === card.id) {
        // Deselect same card
        setSelectedCard(null);
        setMatchCards((prev) =>
          prev.map((c) =>
            c.id === card.id ? { ...c, isSelected: false } : c
          )
        );
      } else if (selectedCard.type === card.type) {
        // Same type - just switch selection
        setMatchCards((prev) =>
          prev.map((c) => ({
            ...c,
            isSelected: c.id === card.id,
          }))
        );
        setSelectedCard(card);
      } else {
        // Different types - check for match
        if (selectedCard.cardId === card.cardId) {
          // Correct match!
          const newMatchedPairs = matchedPairs + 1;
          setMatchedPairs(newMatchedPairs);
          awardXP("card-studied");

          setMatchCards((prev) =>
            prev.map((c) =>
              c.cardId === card.cardId
                ? { ...c, isMatched: true, isSelected: false }
                : c
            )
          );
          setSelectedCard(null);

          // Check for game complete
          if (newMatchedPairs === totalPairs) {
            setGamePhase("complete");

            // Save best time
            if (!bestTime || elapsedTime < bestTime) {
              setBestTime(elapsedTime);
              localStorage.setItem(
                `match-best-time-${difficulty}`,
                elapsedTime.toString()
              );
            }

            // Record session
            const durationSeconds = Math.floor(
              (Date.now() - sessionStartTime.current) / 1000
            );
            const isPerfect = mistakes === 0;
            recordSessionComplete({
              cardsStudied: totalPairs,
              isPerfectScore: isPerfect,
              durationSeconds,
            });

            // Bonus XP for match game completion
            awardXP("match-game-complete");
          }
        } else {
          // Wrong match
          setMistakes((prev) => prev + 1);

          // Show wrong animation briefly
          setMatchCards((prev) =>
            prev.map((c) =>
              c.id === selectedCard.id || c.id === card.id
                ? { ...c, isWrong: true, isSelected: false }
                : c
            )
          );

          setTimeout(() => {
            setMatchCards((prev) =>
              prev.map((c) => ({ ...c, isWrong: false }))
            );
          }, 500);

          setSelectedCard(null);
        }
      }
    },
    [selectedCard, matchedPairs, totalPairs, awardXP, recordSessionComplete, difficulty, bestTime, elapsedTime, mistakes]
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Split cards into terms and definitions
  const termCards = matchCards.filter((c) => c.type === "term");
  const defCards = matchCards.filter((c) => c.type === "definition");

  if (cards.length < 4) {
    return (
      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6">
        <p className="text-muted-foreground">
          You need at least 4 flashcards to play Match. Add more cards to this set!
        </p>
      </div>
    );
  }

  if (gamePhase === "setup") {
    return (
      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Match Game</h2>
        <p className="text-muted-foreground mb-6">
          Match terms with their definitions as fast as you can!
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Select Difficulty
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((d) => (
                <Button
                  key={d}
                  variant={difficulty === d ? "default" : "outline"}
                  onClick={() => setDifficulty(d)}
                  disabled={cards.length < DIFFICULTY_CONFIG[d].pairs}
                >
                  {DIFFICULTY_CONFIG[d].label}
                </Button>
              ))}
            </div>
            {cards.length < DIFFICULTY_CONFIG[difficulty].pairs && (
              <p className="text-sm text-orange-500 mt-2">
                Not enough cards. Need {DIFFICULTY_CONFIG[difficulty].pairs}, have{" "}
                {cards.length}.
              </p>
            )}
          </div>

          {bestTime && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Trophy size={16} className="text-yellow-500" />
              <span>Best time: {formatTime(bestTime)}</span>
            </div>
          )}

          <Button
            onClick={initializeGame}
            className="w-full"
            disabled={cards.length < DIFFICULTY_CONFIG[difficulty].pairs}
          >
            Start Game
          </Button>
        </div>
      </div>
    );
  }

  if (gamePhase === "complete") {
    const isNewRecord = bestTime === elapsedTime;
    const isPerfect = mistakes === 0;

    return (
      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6">
        <div className="text-center space-y-4">
          <div className="text-5xl mb-2">
            {isNewRecord ? "🏆" : isPerfect ? "🎉" : "✨"}
          </div>
          <h2 className="text-2xl font-bold">
            {isNewRecord
              ? "New Record!"
              : isPerfect
                ? "Perfect Game!"
                : "Game Complete!"}
          </h2>

          <div className="flex justify-center gap-4">
            <StreakCounter streak={currentStreak} size="md" />
            <XPBadge xp={xp} level={level} />
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold flex items-center justify-center gap-1">
                <Timer size={20} />
                {formatTime(elapsedTime)}
              </div>
              <div className="text-xs text-muted-foreground">Time</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{mistakes}</div>
              <div className="text-xs text-muted-foreground">Mistakes</div>
            </div>
          </div>

          {isNewRecord && (
            <p className="text-yellow-500 font-medium">
              You beat your previous best time!
            </p>
          )}

          <div className="flex gap-2 justify-center pt-4">
            <Button onClick={initializeGame}>
              <RotateCcw size={16} className="mr-2" />
              Play Again
            </Button>
            <Button variant="outline" onClick={() => setGamePhase("setup")}>
              Change Difficulty
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="font-medium">
                {matchedPairs}/{totalPairs}
              </span>
              <span className="text-muted-foreground"> matched</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {mistakes} mistake{mistakes !== 1 ? "s" : ""}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-lg font-mono">
              <Timer size={18} />
              {formatTime(elapsedTime)}
            </div>
            <XPBadge xp={xp} level={level} />
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(matchedPairs / totalPairs) * 100}%` }}
          />
        </div>
      </div>

      {/* Game board */}
      <div className="grid grid-cols-2 gap-4">
        {/* Terms column */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-1">
            Terms
          </div>
          {termCards.map((card) => (
            <MatchCardButton
              key={card.id}
              card={card}
              onClick={() => handleCardClick(card)}
              variant="term"
            />
          ))}
        </div>

        {/* Definitions column */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider px-1">
            Definitions
          </div>
          {defCards.map((card) => (
            <MatchCardButton
              key={card.id}
              card={card}
              onClick={() => handleCardClick(card)}
              variant="definition"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MatchCardButton({
  card,
  onClick,
  variant,
}: {
  card: MatchCard;
  onClick: () => void;
  variant: "term" | "definition";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={card.isMatched}
      className={cn(
        "w-full text-left p-3 rounded-xl border transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        // Base styles
        !card.isMatched && !card.isSelected && !card.isWrong && [
          "bg-card hover:bg-accent",
          variant === "term" ? "border-blue-200 dark:border-blue-900" : "border-emerald-200 dark:border-emerald-900",
        ],
        // Selected state
        card.isSelected && [
          "ring-2",
          variant === "term"
            ? "bg-blue-50 dark:bg-blue-950 border-blue-500 ring-blue-500"
            : "bg-emerald-50 dark:bg-emerald-950 border-emerald-500 ring-emerald-500",
        ],
        // Wrong state
        card.isWrong && "bg-destructive/10 border-destructive animate-shake",
        // Matched state
        card.isMatched && "opacity-40 cursor-default bg-muted border-muted"
      )}
    >
      <div className="text-sm whitespace-pre-wrap break-words line-clamp-3">
        {card.content}
      </div>
    </button>
  );
}
