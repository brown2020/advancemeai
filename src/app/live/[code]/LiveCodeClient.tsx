"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Gamepad2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  ErrorDisplay,
  LoadingState,
  PageContainer,
} from "@/components/common/UIComponents";
import { getFlashcardSet } from "@/services/flashcardService";
import type { FlashcardSet } from "@/types/flashcard";
import type { GamePlayer, GameStatus } from "@/types/live-game";
import { logger } from "@/utils/logger";
import { LiveLobby } from "@/components/live/LiveLobby";
import { LiveJoinScreen } from "@/components/live/LiveJoinScreen";
import { LiveCountdown } from "@/components/live/LiveCountdown";
import { LiveDemoRound } from "@/components/live/LiveDemoRound";
import { LiveResults } from "@/components/live/LiveResults";
import { LiveDemoBadge } from "@/components/live/LiveDemoBadge";
import { buildDemoQuestions, type DemoQuestion } from "@/components/live/live-demo";

function newPlayer(id: string, displayName: string): GamePlayer {
  return {
    id,
    displayName,
    score: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    timeTaken: 0,
    isConnected: true,
    isFinished: false,
  };
}

/**
 * Live game room (demo).
 * A full implementation would sync through Firebase Realtime Database; this
 * version runs on a single device to demonstrate the UI and flow.
 */
export default function LiveCodeClient({
  hostParam,
  setIdParam,
}: {
  hostParam?: string;
  setIdParam?: string;
}) {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const code = params.code as string;
  const isHost = hostParam === "true";
  const setId = setIdParam ?? null;

  const [flashcardSet, setFlashcardSet] = useState<FlashcardSet | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(setId));
  const [error, setError] = useState<string | null>(null);
  const [joinedPlayers, setJoinedPlayers] = useState<GamePlayer[]>([]);
  const [hasJoinedAsPlayer, setHasJoinedAsPlayer] = useState(false);
  const [gameStatus, setGameStatus] = useState<GameStatus>("waiting");
  const [questions, setQuestions] = useState<DemoQuestion[]>([]);
  const [score, setScore] = useState<{ correct: number; total: number } | null>(null);

  // Load the flashcard set the host picked.
  useEffect(() => {
    if (!setId) return;
    let cancelled = false;

    const loadSet = async () => {
      try {
        const set = await getFlashcardSet(setId);
        if (!cancelled) setFlashcardSet(set);
      } catch (err) {
        logger.error("Failed to load set:", err);
        if (!cancelled) setError("Failed to load flashcard set");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadSet();
    return () => {
      cancelled = true;
    };
  }, [setId]);

  // The signed-in host is always the first player.
  const players = useMemo<GamePlayer[]>(() => {
    const host =
      isHost && user ? [newPlayer(user.uid, user.email?.split("@")[0] || "Host")] : [];
    return [...host, ...joinedPlayers];
  }, [isHost, user, joinedPlayers]);

  const hasJoined = isHost ? Boolean(user) : hasJoinedAsPlayer;

  const handleJoinGame = (name: string) => {
    setJoinedPlayers((prev) => [...prev, newPlayer(user?.uid || `guest_${Date.now()}`, name)]);
    setHasJoinedAsPlayer(true);
  };

  const handleStartGame = () => {
    if (players.length < 1) return;
    setQuestions(flashcardSet ? buildDemoQuestions(flashcardSet.cards) : []);
    setGameStatus("countdown");
  };

  const handleCountdownDone = useCallback(() => setGameStatus("playing"), []);

  const handleFinish = (correct: number, total: number) => {
    setScore({ correct, total });
    setGameStatus("finished");
  };

  const leave = () => router.push("/live");

  if (authLoading || isLoading) {
    return (
      <PageContainer width="narrow">
        <LoadingState message="Setting up the game..." />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer width="narrow">
        <ErrorDisplay message={error} />
        <Button onClick={leave}>Back to Live</Button>
      </PageContainer>
    );
  }

  let content: React.ReactNode;

  if (!hasJoined && !isHost) {
    content = <LiveJoinScreen code={code} onJoin={handleJoinGame} onCancel={leave} />;
  } else if (gameStatus === "waiting") {
    content = (
      <LiveLobby
        code={code}
        isHost={isHost}
        players={players}
        setTitle={flashcardSet?.title}
        termCount={flashcardSet?.cards.length}
        onLeave={leave}
        onStart={handleStartGame}
      />
    );
  } else if (gameStatus === "countdown") {
    content = <LiveCountdown onDone={handleCountdownDone} />;
  } else if (gameStatus === "playing") {
    content =
      questions.length > 0 ? (
        <LiveDemoRound questions={questions} onFinish={handleFinish} />
      ) : (
        <div className="space-y-4 text-center">
          <LiveDemoBadge />
          <EmptyState
            icon={<Gamepad2 />}
            title="Game in progress"
            message="This is a preview of the live game feature. Full multiplayer synchronization is coming soon!"
            action={<Button onClick={() => setGameStatus("finished")}>End game (demo)</Button>}
          />
        </div>
      );
  } else {
    content = (
      <LiveResults
        score={score}
        onPlayAgain={leave}
        onExit={() => router.push("/flashcards")}
      />
    );
  }

  return (
    <PageContainer width="narrow" className="max-w-2xl">
      {content}
    </PageContainer>
  );
}
