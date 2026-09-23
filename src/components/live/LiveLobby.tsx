"use client";

import { useState } from "react";
import { ArrowLeft, BookOpen, Check, Copy, Crown, Info, Play, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { GamePlayer } from "@/types/live-game";
import { cn } from "@/utils/cn";
import { logger } from "@/utils/logger";
import { LiveDemoBadge } from "./LiveDemoBadge";

function GameCodeDisplay({ code, isHost }: { code: string; isHost: boolean }) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.error("Failed to copy:", err);
    }
  };

  return (
    <Card className="px-6 py-8 text-center">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Game code
      </p>
      <p className="mt-2 break-all font-mono text-5xl font-bold tracking-[0.2em] text-primary sm:text-6xl">
        {code}
      </p>
      <Button variant="outline" size="sm" onClick={copyCode} className="mt-4">
        {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
        {copied ? "Copied" : "Copy code"}
      </Button>
      {isHost && (
        <p className="mt-3 text-sm text-muted-foreground">
          Players join at <span className="font-semibold text-foreground">/live</span> with this code
        </p>
      )}
    </Card>
  );
}

function PlayerList({ players, isHost }: { players: GamePlayer[]; isHost: boolean }) {
  return (
    <section aria-labelledby="players-heading">
      <h2 id="players-heading" className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <Users className="size-5 text-muted-foreground" aria-hidden />
        Players
        <span className="tabular-nums text-muted-foreground">{players.length}</span>
      </h2>
      {players.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          Waiting for players to join…
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {players.map((player, index) => {
            const isHostPlayer = index === 0 && isHost;
            return (
              <li
                key={player.id}
                className={cn(
                  "flex animate-slide-up items-center gap-3 rounded-2xl border bg-card p-3 shadow-card",
                  isHostPlayer ? "border-primary/40" : "border-border"
                )}
              >
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent font-bold text-primary"
                  aria-hidden
                >
                  {player.displayName.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1 truncate font-semibold">{player.displayName}</span>
                {isHostPlayer && (
                  <Badge>
                    <Crown aria-hidden />
                    Host
                  </Badge>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

type LiveLobbyProps = {
  code: string;
  isHost: boolean;
  players: GamePlayer[];
  setTitle?: string;
  termCount?: number;
  onLeave: () => void;
  onStart: () => void;
};

/** Waiting room: big code, set info and the player list. */
export function LiveLobby({
  code,
  isHost,
  players,
  setTitle,
  termCount,
  onLeave,
  onStart,
}: LiveLobbyProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onLeave}>
          <ArrowLeft aria-hidden />
          Leave
        </Button>
        <LiveDemoBadge />
      </div>

      <GameCodeDisplay code={code} isHost={isHost} />

      {setTitle && (
        <Card className="flex items-center gap-3 p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
            <BookOpen className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold">{setTitle}</p>
            {termCount !== undefined && (
              <p className="text-sm text-muted-foreground">{termCount} terms</p>
            )}
          </div>
        </Card>
      )}

      <PlayerList players={players} isHost={isHost} />

      <p className="flex items-start gap-2 rounded-xl bg-secondary px-4 py-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        Live games are a preview. Players on other devices won&apos;t appear here yet.
      </p>

      {isHost ? (
        <Button size="lg" onClick={onStart} disabled={players.length < 1} className="h-14 w-full text-lg">
          <Play aria-hidden />
          Start game
        </Button>
      ) : (
        <p className="text-center text-muted-foreground" aria-live="polite">
          Waiting for the host to start the game…
        </p>
      )}
    </div>
  );
}
