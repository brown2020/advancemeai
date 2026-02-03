"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  Users,
  Play,
  Copy,
  Check,
  Crown,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFlashcardSet } from "@/services/flashcardService";
import type { FlashcardSet } from "@/types/flashcard";
import type {
  GamePlayer,
  GameStatus,
  GameType,
  LiveGame,
} from "@/types/live-game";
import { generateGameCode, getDefaultGameSettings } from "@/types/live-game";
import { cn } from "@/utils/cn";

/**
 * MVP Live Game Room
 * In a full implementation, this would use Firebase Realtime Database for sync
 * For MVP, this demonstrates the UI and flow
 */
export default function GameRoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const code = params.code as string;
  const isHost = searchParams.get("host") === "true";
  const setId = searchParams.get("setId");
  const gameType = (searchParams.get("type") || "match") as GameType;

  const [flashcardSet, setFlashcardSet] = useState<FlashcardSet | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const [gameStatus, setGameStatus] = useState<GameStatus>("waiting");
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load flashcard set if host
  useEffect(() => {
    if (!setId) {
      setIsLoading(false);
      return;
    }

    const loadSet = async () => {
      try {
        const set = await getFlashcardSet(setId);
        setFlashcardSet(set);
      } catch (err) {
        console.error("Failed to load set:", err);
        setError("Failed to load flashcard set");
      } finally {
        setIsLoading(false);
      }
    };

    void loadSet();
  }, [setId]);

  // Auto-join host
  useEffect(() => {
    if (isHost && user && !hasJoined) {
      setHasJoined(true);
      setPlayers([
        {
          id: user.uid,
          displayName: user.email?.split("@")[0] || "Host",
          score: 0,
          correctAnswers: 0,
          incorrectAnswers: 0,
          timeTaken: 0,
          isConnected: true,
          isFinished: false,
        },
      ]);
    }
  }, [isHost, user, hasJoined]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleJoinGame = useCallback(() => {
    if (!playerName.trim()) return;

    const newPlayer: GamePlayer = {
      id: user?.uid || `guest_${Date.now()}`,
      displayName: playerName.trim(),
      score: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      timeTaken: 0,
      isConnected: true,
      isFinished: false,
    };

    setPlayers((prev) => [...prev, newPlayer]);
    setHasJoined(true);
  }, [playerName, user?.uid]);

  const handleStartGame = useCallback(() => {
    if (players.length < 1) return;
    setGameStatus("countdown");

    // Simulate countdown
    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(interval);
        setGameStatus("playing");
      }
    }, 1000);
  }, [players.length]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={() => router.push("/live")}>Back to Live</Button>
      </div>
    );
  }

  // Player join screen (for non-hosts who haven't joined)
  if (!hasJoined && !isHost) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Join Game</h1>
            <p className="text-muted-foreground">
              Game Code: <span className="font-mono font-bold">{code}</span>
            </p>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Your Name
            </label>
            <Input
              id="name"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              maxLength={20}
              className="text-center text-lg"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleJoinGame()}
            />
          </div>

          <Button
            onClick={handleJoinGame}
            disabled={!playerName.trim()}
            className="w-full"
          >
            Join
          </Button>

          <button
            onClick={() => router.push("/live")}
            className="w-full text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Waiting lobby
  if (gameStatus === "waiting") {
    return (
      <div className="min-h-screen flex flex-col p-4">
        <div className="container max-w-2xl mx-auto flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => router.push("/live")}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Leave
            </button>
            {isHost && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 text-xs font-medium">
                <Crown className="h-3 w-3" />
                Host
              </span>
            )}
          </div>

          {/* Game Code Display */}
          <div className="text-center mb-8">
            <p className="text-sm text-muted-foreground mb-2">Game Code</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-5xl font-mono font-bold tracking-wider">
                {code}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                title="Copy code"
              >
                {copied ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <Copy className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Share this code with your students
            </p>
          </div>

          {/* Set info */}
          {flashcardSet && (
            <div className="text-center mb-8 p-4 rounded-lg border bg-card">
              <p className="font-medium">{flashcardSet.title}</p>
              <p className="text-sm text-muted-foreground">
                {flashcardSet.cards.length} terms
              </p>
            </div>
          )}

          {/* Players */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5" />
              <span className="font-medium">Players ({players.length})</span>
            </div>

            <div className="grid gap-2 mb-8">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border",
                    index === 0 && isHost
                      ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                      : "bg-card"
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-medium text-primary">
                    {player.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="flex-1 font-medium">
                    {player.displayName}
                  </span>
                  {index === 0 && isHost && (
                    <Crown className="h-4 w-4 text-amber-500" />
                  )}
                </div>
              ))}

              {players.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Waiting for players to join...
                </div>
              )}
            </div>
          </div>

          {/* Start Button (Host only) */}
          {isHost && (
            <Button
              onClick={handleStartGame}
              disabled={players.length < 1}
              className="w-full h-14 text-lg"
            >
              <Play className="h-5 w-5 mr-2" />
              Start Game
            </Button>
          )}

          {!isHost && (
            <div className="text-center text-muted-foreground">
              Waiting for host to start the game...
            </div>
          )}
        </div>
      </div>
    );
  }

  // Game playing state (placeholder for full implementation)
  if (gameStatus === "countdown" || gameStatus === "playing") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center">
          {gameStatus === "countdown" ? (
            <>
              <h1 className="text-6xl font-bold mb-4">Get Ready!</h1>
              <p className="text-muted-foreground">Game starting...</p>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold mb-4">Game in Progress</h1>
              <p className="text-muted-foreground mb-8">
                This is a preview of the live game feature. Full multiplayer
                synchronization coming soon!
              </p>
              <Button onClick={() => setGameStatus("finished")}>
                End Game (Demo)
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Game finished state
  if (gameStatus === "finished") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold mb-4">Game Over!</h1>
          <p className="text-muted-foreground mb-8">
            Thanks for trying the Live Game preview.
          </p>
          <div className="space-y-3">
            <Button onClick={() => router.push("/live")} className="w-full">
              Play Again
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/flashcards")}
              className="w-full"
            >
              Back to Flashcards
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
