"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { Crown, PartyPopper, Play, Puzzle, Timer, Trophy } from "lucide-react";
import type { Flashcard } from "@/types/flashcard";
import type { XPEventType } from "@/types/gamification";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { EmptyState } from "@/components/common/UIComponents";
import { StreakCounter } from "@/components/gamification/StreakCounter";
import { XPBadge } from "@/components/gamification/XPProgress";
import { useGamification } from "@/hooks/useGamification";
import { shuffle } from "@/utils/random";
import { formatDuration, secondsSince } from "./study-utils";
import { percent } from "@/utils/format";
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

function storeBestTime(difficulty: Difficulty, elapsedTime: number) {
  try {
    localStorage.setItem(bestTimeKey(difficulty), elapsedTime.toString());
  } catch {
    // Storage unavailable (private mode): best time just isn't kept.
  }
}

function shouldStoreBestTime(bestTime: number | null, elapsedTime: number): boolean {
  return !bestTime || elapsedTime < bestTime;
}

/** Easy is always playable (it uses every card when there are fewer than 6). */
function isDifficultyAvailable(difficulty: Difficulty, cardCount: number) {
  return difficulty === "easy" || cardCount >= DIFFICULTY_CONFIG[difficulty].pairs;
}

function defaultDifficulty(cardCount: number): Difficulty {
  if (isDifficultyAvailable("medium", cardCount)) return "medium";
  return "easy";
}

function toMatchTile(card: Flashcard, type: MatchCard["type"]): MatchCard {
  const isTerm = type === "term";
  return {
    id: `${isTerm ? "term" : "def"}-${card.id}`,
    cardId: card.id,
    type,
    content: isTerm ? card.term : card.definition,
    imageUrl: isTerm ? card.termImageUrl : card.definitionImageUrl,
    isMatched: false,
    isSelected: false,
    isWrong: false,
  };
}

function buildMatchBoard(cards: readonly Flashcard[], totalPairs: number): MatchCard[] {
  const selectedCards = shuffle(cards).slice(0, totalPairs);
  return [
    ...shuffle(selectedCards.map((card) => toMatchTile(card, "term"))),
    ...shuffle(selectedCards.map((card) => toMatchTile(card, "definition"))),
  ];
}

function cardsOfType(cards: readonly MatchCard[], type: MatchCard["type"]): MatchCard[] {
  const next: MatchCard[] = [];
  for (const card of cards) {
    if (card.type === type) next.push(card);
  }
  return next;
}

function markSelected(cards: readonly MatchCard[], selectedId: string): MatchCard[] {
  const next: MatchCard[] = [];
  for (const card of cards) {
    if (card.id === selectedId) next.push({ ...card, isSelected: true });
    else next.push(card);
  }
  return next;
}

function clearSelected(cards: readonly MatchCard[], cardId: string): MatchCard[] {
  const next: MatchCard[] = [];
  for (const card of cards) {
    if (card.id === cardId) next.push({ ...card, isSelected: false });
    else next.push(card);
  }
  return next;
}

function selectOnly(cards: readonly MatchCard[], cardId: string): MatchCard[] {
  const next: MatchCard[] = [];
  for (const card of cards) {
    next.push({ ...card, isSelected: card.id === cardId });
  }
  return next;
}

function markMatched(cards: readonly MatchCard[], cardId: string): MatchCard[] {
  const next: MatchCard[] = [];
  for (const card of cards) {
    if (card.cardId === cardId) next.push({ ...card, isMatched: true, isSelected: false });
    else next.push(card);
  }
  return next;
}

function flagWrong(cards: readonly MatchCard[], firstId: string, secondId: string): MatchCard[] {
  const next: MatchCard[] = [];
  for (const card of cards) {
    if (card.id === firstId || card.id === secondId) {
      next.push({ ...card, isWrong: true, isSelected: false });
    } else {
      next.push(card);
    }
  }
  return next;
}

function clearWrong(cards: readonly MatchCard[]): MatchCard[] {
  const next: MatchCard[] = [];
  for (const card of cards) next.push({ ...card, isWrong: false });
  return next;
}

function difficultyOptions(cardCount: number) {
  return DIFFICULTIES.map((difficulty) => ({
    value: difficulty,
    label: DIFFICULTY_CONFIG[difficulty].label,
    disabled: !isDifficultyAvailable(difficulty, cardCount),
  }));
}

function matchResultIcon(isNewRecord: boolean, isPerfect: boolean) {
  if (isNewRecord) return Crown;
  if (isPerfect) return PartyPopper;
  return Trophy;
}

function matchResultTitle(isNewRecord: boolean, isPerfect: boolean): string {
  if (isNewRecord) return "New record!";
  if (isPerfect) return "Perfect game!";
  return "Game complete!";
}

function matchResultMessage(isNewRecord: boolean): string | undefined {
  if (isNewRecord) return "You beat your previous best time.";
  return undefined;
}

function mistakeTone(mistakes: number): "success" | "destructive" {
  if (mistakes === 0) return "success";
  return "destructive";
}

function bestTimeLabel(bestTime: number | null): string {
  if (bestTime) return formatDuration(bestTime);
  return "—";
}

function mistakeSuffix(mistakes: number): string {
  if (mistakes === 1) return "";
  return "s";
}

type SelectedCardRef = { current: MatchCard | null };

function onMatchCardClick(
  card: MatchCard,
  selectedCardRef: SelectedCardRef,
  matchedPairs: number,
  totalPairs: number,
  setMatchCards: Dispatch<SetStateAction<MatchCard[]>>,
  setMatchedPairs: Dispatch<SetStateAction<number>>,
  setMistakes: Dispatch<SetStateAction<number>>,
  setAnnouncement: Dispatch<SetStateAction<string>>,
  awardXP: (eventType: XPEventType) => void,
  completeGame: () => void,
) {
  if (card.isMatched || card.isWrong) return;
  const selectedCard = selectedCardRef.current;

  if (!selectedCard) {
    selectedCardRef.current = card;
    setMatchCards((prev) => markSelected(prev, card.id));
    return;
  }

  if (selectedCard.id === card.id) {
    selectedCardRef.current = null;
    setMatchCards((prev) => clearSelected(prev, card.id));
    return;
  }

  if (selectedCard.type === card.type) {
    setMatchCards((prev) => selectOnly(prev, card.id));
    selectedCardRef.current = card;
    return;
  }

  if (selectedCard.cardId === card.cardId) {
    const newMatchedPairs = matchedPairs + 1;
    setMatchedPairs(newMatchedPairs);
    awardXP("card-studied");
    setMatchCards((prev) => markMatched(prev, card.cardId));
    selectedCardRef.current = null;
    setAnnouncement(`Match! ${newMatchedPairs} of ${totalPairs} pairs found.`);
    if (newMatchedPairs === totalPairs) completeGame();
    return;
  }

  // Wrong pair: flash both tiles, then clear.
  const selectedId = selectedCard.id;
  setMistakes((prev) => prev + 1);
  setAnnouncement("Not a match. Try again.");
  setMatchCards((prev) => flagWrong(prev, selectedId, card.id));
  setTimeout(() => {
    setMatchCards((prev) => clearWrong(prev));
  }, 500);
  selectedCardRef.current = null;
}

function MatchTooSmall({ onExit }: { onExit?: () => void }) {
  return (
    <div className="space-y-4">
      <StudyTopBar progress={0} />
      <EmptyState
        icon={<Puzzle />}
        title="Not enough cards to match"
        message={`Match needs at least ${MIN_CARDS} cards. Add a few more terms to this set.`}
        action={
          onExit ? (
            <Button type="button" variant="outline" onClick={onExit}>
              Back to set
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}

function MatchSetup({
  difficulty,
  cardCount,
  bestTime,
  streak,
  xp,
  level,
  onDifficulty,
  onStart,
}: {
  difficulty: Difficulty;
  cardCount: number;
  bestTime: number | null;
  streak: number;
  xp: number;
  level: number;
  onDifficulty: (difficulty: Difficulty) => void;
  onStart: () => void;
}) {
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
            onChange={onDifficulty}
            options={difficultyOptions(cardCount)}
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
          <StreakCounter streak={streak} size="sm" showLabel={false} />
          <XPBadge xp={xp} level={level} />
        </div>

        <Button type="button" size="lg" className="mt-8 w-full sm:w-auto" onClick={onStart}>
          <Play aria-hidden />
          Start game
        </Button>
      </section>
    </div>
  );
}

function MatchComplete({
  elapsedTime,
  mistakes,
  bestTime,
  totalPairs,
  xp,
  level,
  streak,
  onPlayAgain,
  onChangeDifficulty,
}: {
  elapsedTime: number;
  mistakes: number;
  bestTime: number | null;
  totalPairs: number;
  xp: number;
  level: number;
  streak: number;
  onPlayAgain: () => void;
  onChangeDifficulty: () => void;
}) {
  const isNewRecord = bestTime === elapsedTime;
  const isPerfect = mistakes === 0;

  return (
    <div className="space-y-4">
      <StudyTopBar progress={100} progressLabel={`${totalPairs} / ${totalPairs}`} />
      <StudyResults
        icon={matchResultIcon(isNewRecord, isPerfect)}
        title={matchResultTitle(isNewRecord, isPerfect)}
        message={matchResultMessage(isNewRecord)}
        stats={[
          { label: "Time", value: formatDuration(elapsedTime), tone: "primary" },
          { label: "Mistakes", value: mistakes, tone: mistakeTone(mistakes) },
          { label: "Best", value: bestTimeLabel(bestTime) },
        ]}
        rewards={{ xp, level, streak }}
        againLabel="Play again"
        onStudyAgain={onPlayAgain}
        extraActions={
          <Button type="button" variant="outline" size="lg" onClick={onChangeDifficulty}>
            Change difficulty
          </Button>
        }
      />
    </div>
  );
}

function MatchColumn({
  label,
  cards,
  onSelect,
}: {
  label: string;
  cards: MatchCard[];
  onSelect: (card: MatchCard) => void;
}) {
  return (
    <div className="space-y-2.5" role="group" aria-label={label}>
      <h3 className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </h3>
      {cards.map((card) => (
        <MatchTile key={card.id} card={card} onSelect={() => onSelect(card)} />
      ))}
    </div>
  );
}

function MatchBoard({
  matchedPairs,
  totalPairs,
  elapsedTime,
  mistakes,
  announcement,
  matchCards,
  onSelect,
}: {
  matchedPairs: number;
  totalPairs: number;
  elapsedTime: number;
  mistakes: number;
  announcement: string;
  matchCards: MatchCard[];
  onSelect: (card: MatchCard) => void;
}) {
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
          {mistakes} mistake{mistakeSuffix(mistakes)}
        </span>
      </p>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
        <MatchColumn label="Terms" cards={cardsOfType(matchCards, "term")} onSelect={onSelect} />
        <MatchColumn
          label="Definitions"
          cards={cardsOfType(matchCards, "definition")}
          onSelect={onSelect}
        />
      </div>
    </div>
  );
}

type MatchModeProps = {
  cards: Flashcard[];
  flashcardSetId?: string;
};

export function MatchMode({ cards, flashcardSetId }: MatchModeProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>(() => defaultDifficulty(cards.length));
  const [gamePhase, setGamePhase] = useState<GamePhase>("setup");
  const [matchCards, setMatchCards] = useState<MatchCard[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const session = useStudySession();
  const { xp, level, currentStreak, recordSessionComplete, awardXP } = useGamification();
  const sessionStartTime = useRef(0);
  const selectedCardRef = useRef<MatchCard | null>(null);

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
    setMatchCards(buildMatchBoard(cards, totalPairs));
    selectedCardRef.current = null;
    setMatchedPairs(0);
    setMistakes(0);
    setElapsedTime(0);
    setAnnouncement("");
    setGamePhase("playing");
    sessionStartTime.current = Date.now();
  };

  const completeGame = () => {
    setGamePhase("complete");
    if (shouldStoreBestTime(bestTime, elapsedTime)) {
      setBestTime(elapsedTime);
      storeBestTime(difficulty, elapsedTime);
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
    onMatchCardClick(
      card,
      selectedCardRef,
      matchedPairs,
      totalPairs,
      setMatchCards,
      setMatchedPairs,
      setMistakes,
      setAnnouncement,
      awardXP,
      completeGame,
    );
  };

  if (cards.length < MIN_CARDS) return <MatchTooSmall onExit={session?.exit} />;

  if (gamePhase === "setup") {
    return (
      <MatchSetup
        difficulty={difficulty}
        cardCount={cards.length}
        bestTime={bestTime}
        streak={currentStreak}
        xp={xp}
        level={level}
        onDifficulty={setDifficulty}
        onStart={initializeGame}
      />
    );
  }

  if (gamePhase === "complete") {
    return (
      <MatchComplete
        elapsedTime={elapsedTime}
        mistakes={mistakes}
        bestTime={bestTime}
        totalPairs={totalPairs}
        xp={xp}
        level={level}
        streak={currentStreak}
        onPlayAgain={initializeGame}
        onChangeDifficulty={() => setGamePhase("setup")}
      />
    );
  }

  return (
    <MatchBoard
      matchedPairs={matchedPairs}
      totalPairs={totalPairs}
      elapsedTime={elapsedTime}
      mistakes={mistakes}
      announcement={announcement}
      matchCards={matchCards}
      onSelect={handleCardClick}
    />
  );
}
