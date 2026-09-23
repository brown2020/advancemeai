import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveDemoBadge } from "./LiveDemoBadge";

/** End-of-game screen for the demo flow. */
export function LiveResults({
  score,
  onPlayAgain,
  onExit,
}: {
  score: { correct: number; total: number } | null;
  onPlayAgain: () => void;
  onExit: () => void;
}) {
  return (
    <div className="animate-fade-in text-center">
      <LiveDemoBadge />
      <div className="mx-auto mt-6 flex size-20 items-center justify-center rounded-3xl bg-streak/15 text-streak">
        <Trophy className="size-10" aria-hidden />
      </div>
      <h1 className="mt-5 text-3xl font-bold tracking-tight">Game over!</h1>
      {score ? (
        <p className="mt-3 text-5xl font-bold tabular-nums">
          {score.correct}
          <span className="text-muted-foreground">/{score.total}</span>
        </p>
      ) : null}
      <p className="mt-3 text-muted-foreground">
        Thanks for trying the Live Game preview. Full multiplayer is coming soon.
      </p>
      <div className="mx-auto mt-8 flex max-w-xs flex-col gap-2">
        <Button size="lg" onClick={onPlayAgain}>
          Play again
        </Button>
        <Button variant="outline" size="lg" onClick={onExit}>
          Back to Flashcards
        </Button>
      </div>
    </div>
  );
}
