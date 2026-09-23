"use client";

import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Pause,
  Play,
  Shuffle,
  Star,
  StarOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/common/UIComponents";
import { FlashcardSettings } from "@/components/flashcards/study/FlashcardSettings";
import { cn } from "@/utils/cn";
import { FlipCard } from "./FlipCard";
import type { FlashcardDeck } from "./useFlashcardDeck";

type FlashcardViewerProps = {
  deck: FlashcardDeck;
  isStarred: (cardId: string) => boolean;
  onToggleStar: (cardId: string) => void;
  hasStarredCards: boolean;
  /** Opens the focused, full-width flashcards mode. */
  onExpand?: () => void;
  size?: "default" | "large";
};

/** Big flip card with navigation, progress, shuffle, star and options. */
export function FlashcardViewer({
  deck,
  isStarred,
  onToggleStar,
  hasStarredCards,
  onExpand,
  size = "default",
}: FlashcardViewerProps) {
  const { currentCard, currentIndex, total, isFlipped, settings } = deck;

  if (!currentCard) {
    return (
      <EmptyState
        icon={<StarOff />}
        title="No starred terms"
        message="Star terms to study just those, or switch back to the full set."
        action={
          <Button
            type="button"
            variant="outline"
            onClick={() => deck.updateSettings({ ...settings, starredOnly: false })}
          >
            Show all terms
          </Button>
        }
      />
    );
  }

  const termFace = {
    label: "Term",
    text: currentCard.term,
    imageUrl: currentCard.termImageUrl,
  };
  const definitionFace = {
    label: "Definition",
    text: currentCard.definition,
    imageUrl: currentCard.definitionImageUrl,
  };
  const [front, back] = settings.showDefinitionFirst
    ? [definitionFace, termFace]
    : [termFace, definitionFace];
  const visible = isFlipped ? back : front;
  const starred = isStarred(currentCard.id);

  return (
    <div>
      <div className="relative">
        <FlipCard
          front={front}
          back={back}
          isFlipped={isFlipped}
          onFlip={deck.flip}
          onSwipeLeft={deck.next}
          onSwipeRight={deck.prev}
          size={size}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onToggleStar(currentCard.id)}
          aria-pressed={starred}
          aria-label={starred ? "Unstar this term" : "Star this term"}
          className={cn(
            "absolute right-2 top-2 z-10 rounded-full sm:right-3 sm:top-3",
            starred ? "text-warning hover:text-warning" : "text-muted-foreground"
          )}
        >
          <Star className={cn(starred && "fill-current")} />
        </Button>
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {`Card ${currentIndex + 1} of ${total}. ${visible.label}: ${visible.text}`}
      </p>

      <div className="mt-4 flex items-center justify-between gap-1 sm:gap-2">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={deck.toggleShuffle}
            aria-pressed={settings.shuffle}
            aria-label={settings.shuffle ? "Turn shuffle off" : "Shuffle cards"}
            className={cn(settings.shuffle && "bg-accent text-primary hover:bg-accent")}
          >
            <Shuffle />
          </Button>
          {settings.autoplay ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={deck.toggleAutoplayPaused}
              aria-label={deck.isAutoplayPaused ? "Resume autoplay" : "Pause autoplay"}
            >
              {deck.isAutoplayPaused ? <Play /> : <Pause />}
            </Button>
          ) : null}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={deck.prev}
            disabled={currentIndex === 0}
            aria-label="Previous card"
          >
            <ChevronLeft />
          </Button>
          <span className="min-w-16 text-center text-sm font-semibold tabular-nums">
            {currentIndex + 1} / {total}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={deck.next}
            disabled={currentIndex >= total - 1}
            aria-label="Next card"
          >
            <ChevronRight />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <FlashcardSettings
            settings={settings}
            onChange={deck.updateSettings}
            onRestart={deck.restart}
            hasStarredCards={hasStarredCards}
          />
          {onExpand ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onExpand}
              aria-label="Open full-screen flashcards"
            >
              <Maximize2 />
            </Button>
          ) : null}
        </div>
      </div>

      <Progress
        value={((currentIndex + 1) / total) * 100}
        label="Card progress"
        className="mt-3 h-1"
      />
      <p className="mt-2 hidden text-center text-xs text-muted-foreground sm:block">
        Space to flip · ← → to move
      </p>
    </div>
  );
}
