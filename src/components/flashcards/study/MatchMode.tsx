"use client";

import { useEffect, useRef, useState } from "react";
import { Crown, PartyPopper, Play, Puzzle, Timer, Trophy } from "lucide-react";
import type { Flashcard } from "@/types/flashcard";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { EmptyState } from "@/components/common/UIComponents";
import { StreakCounter, XPBadge } from "@/components/gamification";
import { useGamification } from "@/hooks/useGamification";
import { formatDuration, percent, secondsSince, shuffle } from "./study-utils";
import { MatchTile, type MatchCard } from "./MatchTile";
import { StudyResults } from "./StudyResults";
import { StudyTopBar } from "./StudyTopBar";
import { useStudySession } from "./StudySessionContext";

type Difficulty = "easy" | "medium" | "hard";
type GamePhase = "setup" | "playing" | "complete";

const MIN_CARDS = 4;

const DIFFICULTY_CONFIG: Record<Difficulty, { pairs: number; label: string }> = {
  easy: { pairs: 6, label: "Easy · 6" },
  medium: { pairs: 9, label: "Medium · 9" },
  hard: { pairs: 12, label: "Hard · 12" },
};

const DIFFICULTIES = Object.keys(DIFFICULTY_CONFIG) as Difficulty[];

function bestTimeKey(difficulty: Difficulty) {
  return `match-best-time-${difficulty}`;
}

function readBestTime(difficulty: Difficulty): number | null {
  try {
    const saved = localStorage.getItem(bestTimeKey(difficulty));
    return saved ? Number.parseInt(saved, 10) : null;
  } catch {
    return null;
  }
}

/** Easy is always playable (it uses every card when there are fewer than 6). */
function isDifficultyAvailable(difficulty: Difficulty, cardCount: number) {
  return difficulty === "easy" || cardCount >= DIFFICULTY_CONFIG[difficulty].pairs;
}

type MatchModeProps = {
  cards: Flashcard[];
  flashcardSetId?: string;
};

export function MatchMode({ cards, flashcardSetId }: MatchModeProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>(() =>
    isDifficultyAvailable("medium", cards.length) ? "medium" : "easy"
  );
  const [gamePhase, setGamePhase] = useState<GamePhase>("setup");
  const [matchCards, setMatchCards] = useState<MatchCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<MatchCard | null>(null);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const session = useStudySession();
  const { xp, level, currentStreak, recordSessionComplete, awardXP } =
    useGamification();
  const sessionStartTime = useRef(0);

  const totalPairs = Math.min(DIFFICULTY_CONFIG[difficulty].pairs, cards.length);

  useEffect(() => {
    if (gamePhase !== "playing") return;
    const interval = setInterval(() => setElapsedTime((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [gamePhase]);

  useEffect(() => {
    setBestTime(readBestTime(difficulty));
  }, [difficulty]);

  const initializeGame = () => {
    const selectedCards = shuffle(cards).slice(0, totalPairs);
    const toTile = (card: Flashcard, type: MatchCard["type"]): MatchCard => ({
      id: `${type === "term" ? "term" : "def"}-${card.id}`,
      cardId: card.id,
      type,
      content: type === "term" ? card.term : card.definition,
      imageUrl: type === "term" ? card.termImageUrl : card.definitionImageUrl,
      isMatched: false,
      isSelected: false,
      isWrong: false,
    });

    setMatchCards([
      ...shuffle(selectedCards.map((c) => toTile(c, "term"))),
      ...shuffle(selectedCards.map((c) => toTile(c, "definition"))),
    ]);
    setSelectedCard(null);
    setMatchedPairs(0);
    setMistakes(0);
    setElapsedTime(0);
    setAnnouncement("");
    setGamePhase("playing");
    sessionStartTime.current = Date.now();
  };

  const completeGame = () => {
    setGamePhase("complete");

    if (!bestTime || elapsedTime < bestTime) {
      setBestTime(elapsedTime);
      try {
        localStorage.setItem(bestTimeKey(difficulty), elapsedTime.toString());
      } catch {
        // Storage unavailable (private mode): best time just isn't kept.
      }
    }

    void recordSessionComplete({
      cardsStudied: totalPairs,
      isPerfectScore: mistakes === 0,
      durationSeconds: secondsSince(sessionStartTime.current),
      flashcardSetId,
    });
    awardXP("match-game-complete");
  };

  const handleCardClick = (card: MatchCard) => {
    if (card.isMatched || card.isWrong) return;

    if (!selectedCard) {
      setSelectedCard(card);
      setMatchCards((prev) =>
        prev.map((c) => (c.id === card.id ? { ...c, isSelected: true } : c))
      );
      return;
    }

    if (selectedCard.id === card.id) {
      setSelectedCard(null);
      setMatchCards((prev) =>
        prev.map((c) => (c.id === card.id ? { ...c, isSelected: false } : c))
      );
      return;
    }

    if (selectedCard.type === card.type) {
      setMatchCards((prev) => prev.map((c) => ({ ...c, isSelected: c.id === card.id })));
      setSelectedCard(card);
      return;
    }

    if (selectedCard.cardId === card.cardId) {
      const newMatchedPairs = matchedPairs + 1;
      setMatchedPairs(newMatchedPairs);
      awardXP("card-studied");
      setMatchCards((prev) =>
        prev.map((c) =>
          c.cardId === card.cardId ? { ...c, isMatched: true, isSelected: false } : c
        )
      );
      setSelectedCard(null);
      setAnnouncement(`Match! ${newMatchedPairs} of ${totalPairs} pairs found.`);
      if (newMatchedPairs === totalPairs) completeGame();
      return;
    }

    // Wrong pair: flash both tiles, then clear.
    setMistakes((prev) => prev + 1);
    setAnnouncement("Not a match. Try again.");
    setMatchCards((prev) =>
      prev.map((c) =>
        c.id === selectedCard.id || c.id === card.id
          ? { ...c, isWrong: true, isSelected: false }
          : c
      )
    );
    setTimeout(() => {
      setMatchCards((prev) => prev.map((c) => ({ ...c, isWrong: false })));
    }, 500);
    setSelectedCard(null);
  };

  if (cards.length < MIN_CARDS) {
    return (
      <div className="space-y-4">
        <StudyTopBar progress={0} />
        <EmptyState
          icon={<Puzzle />}
          title="Not enough cards to match"
          message={`Match needs at least ${MIN_CARDS} cards. Add a few more terms to this set.`}
          action={
            session ? (
              <Button type="button" variant="outline" onClick={session.exit}>
                Back to set
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  if (gamePhase === "setup") {
    return (
      <div className="space-y-4">
        <StudyTopBar progress={0} />
        <section className="rounded-3xl border border-border bg-card p-6 text-center shadow-card sm:p-10">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-accent text-primary">
            <Puzzle className="size-7" aria-hidden />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Ready to play?</h2>
          <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
            Match every term with its definition as fast as you can.
          </p>

          <div className="mt-6 flex flex-col items-center gap-2">
            <span className="text-sm font-semibold">Choose difficulty</span>
            <Segmented
              label="Difficulty"
              value={difficulty}
              onChange={setDifficulty}
              options={DIFFICULTIES.map((d) => ({
                value: d,
                label: DIFFICULTY_CONFIG[d].label,
                disabled: !isDifficultyAvailable(d, cards.length),
              }))}
              className="mx-0 justify-center rounded-full bg-secondary p-1"
            />
          </div>

          {bestTime ? (
            <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Trophy className="size-4 text-warning" aria-hidden />
              Best time: <span className="font-semibold tabular-nums">{formatDuration(bestTime)}</span>
            </p>
          ) : null}

          <div className="mt-6 flex items-center justify-center gap-3">
            <StreakCounter streak={currentStreak} size="sm" showLabel={false} />
            <XPBadge xp={xp} level={level} />
          </div>

          <Button type="button" size="lg" className="mt-8 w-full sm:w-auto" onClick={initializeGame}>
            <Play aria-hidden />
            Start game
          </Button>
        </section>
      </div>
    );
  }

  if (gamePhase === "complete") {
    const isNewRecord = bestTime === elapsedTime;
    const isPerfect = mistakes === 0;

    return (
      <div className="space-y-4">
        <StudyTopBar progress={100} progressLabel={`${totalPairs} / ${totalPairs}`} />
        <StudyResults
          icon={isNewRecord ? Crown : isPerfect ? PartyPopper : Trophy}
          title={isNewRecord ? "New record!" : isPerfect ? "Perfect game!" : "Game complete!"}
          message={isNewRecord ? "You beat your previous best time." : undefined}
          stats={[
            { label: "Time", value: formatDuration(elapsedTime), tone: "primary" },
            {
              label: "Mistakes",
              value: mistakes,
              tone: mistakes === 0 ? "success" : "destructive",
            },
            {
              label: "Best",
              value: bestTime ? formatDuration(bestTime) : "—",
            },
          ]}
          rewards={{ xp, level, streak: currentStreak }}
          againLabel="Play again"
          onStudyAgain={initializeGame}
          extraActions={
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={() => setGamePhase("setup")}
            >
              Change difficulty
            </Button>
          }
        />
      </div>
    );
  }

  const termCards = matchCards.filter((c) => c.type === "term");
  const defCards = matchCards.filter((c) => c.type === "definition");

  return (
    <div className="space-y-4">
      <StudyTopBar
        progress={percent(matchedPairs, totalPairs)}
        progressLabel={`${matchedPairs} / ${totalPairs}`}
        actions={
          <span
            className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1.5 text-sm font-semibold tabular-nums"
            aria-label={`Time ${formatDuration(elapsedTime)}`}
          >
            <Timer className="size-4 text-muted-foreground" aria-hidden />
            {formatDuration(elapsedTime)}
          </span>
        }
      />

      <p className="text-center text-sm text-muted-foreground">
        Tap a term, then its definition.{" "}
        <span className="tabular-nums">
          {mistakes} mistake{mistakes === 1 ? "" : "s"}
        </span>
      </p>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
        <div className="space-y-2.5" role="group" aria-label="Terms">
          <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Terms
          </h3>
          {termCards.map((card) => (
            <MatchTile key={card.id} card={card} onSelect={() => handleCardClick(card)} />
          ))}
        </div>
        <div className="space-y-2.5" role="group" aria-label="Definitions">
          <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Definitions
          </h3>
          {defCards.map((card) => (
            <MatchTile key={card.id} card={card} onSelect={() => handleCardClick(card)} />
          ))}
        </div>
      </div>
    </div>
  );
}
