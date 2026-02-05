"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  BookOpen,
  Settings,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { getUserFlashcardSets } from "@/services/flashcardService";
import type { FlashcardSet } from "@/types/flashcard";
import type { GameType } from "@/types/live-game";
import {
  generateGameCode,
  getGameTypeName,
  getGameTypeDescription,
} from "@/types/live-game";
import { isTeacher } from "@/types/user-profile";
import { cn } from "@/utils/cn";

export default function HostGamePage() {
  const router = useRouter();
  const { user, userProfile, isLoading: authLoading } = useAuth();

  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [gameType, setGameType] = useState<GameType>("match");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const canHost = isTeacher(userProfile);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth/signin?returnTo=/live/host");
      return;
    }

    const loadSets = async () => {
      try {
        const userSets = await getUserFlashcardSets(user.uid);
        // Filter sets with at least 4 cards for games
        const validSets = userSets.filter((s) => s.cards.length >= 4);
        setSets(validSets);
        if (validSets.length > 0 && validSets[0]) {
          setSelectedSetId(validSets[0].id);
        }
      } catch (error) {
        console.error("Failed to load sets:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadSets();
  }, [user, authLoading, router]);

  const handleCreateGame = async () => {
    if (!selectedSetId || !user) return;

    setIsCreating(true);
    try {
      // Generate a game code
      const code = generateGameCode();

      // For MVP, we'll store game state in URL and use Realtime Database
      // Navigate to the game room as host
      router.push(
        `/live/${code}?host=true&setId=${selectedSetId}&type=${gameType}`
      );
    } catch (error) {
      console.error("Failed to create game:", error);
    } finally {
      setIsCreating(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (!canHost) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/live"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-amber-500" />
          <h1 className="text-2xl font-bold mb-2">Teacher Account Required</h1>
          <p className="text-muted-foreground mb-6">
            Only teachers can host live games. Update your role in settings if
            you&apos;re a teacher.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/profile">
              <Button>Update Profile</Button>
            </Link>
            <Link href="/live">
              <Button variant="outline">Join a Game</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedSet = sets.find((s) => s.id === selectedSetId);

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/live"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Host a Live Game</h1>
        <p className="text-muted-foreground">
          Create a live game for your students to join
        </p>
      </div>

      <div className="space-y-8">
        {/* Select Set */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Select a Flashcard Set
          </h2>

          {sets.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-6 text-center">
              <p className="text-muted-foreground mb-4">
                You need a flashcard set with at least 4 cards to host a game.
              </p>
              <Link href="/flashcards/create">
                <Button>Create a Set</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-2">
              {sets.map((set) => (
                <button
                  key={set.id}
                  onClick={() => setSelectedSetId(set.id)}
                  className={cn(
                    "w-full p-4 rounded-lg border text-left transition-colors",
                    selectedSetId === set.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="font-medium">{set.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {set.cards.length} terms
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Select Game Type */}
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Game Type
          </h2>
          <div className="grid gap-2">
            {(["match", "blast"] as GameType[]).map((type) => (
              <button
                key={type}
                onClick={() => setGameType(type)}
                className={cn(
                  "w-full p-4 rounded-lg border text-left transition-colors",
                  gameType === type
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="font-medium">{getGameTypeName(type)}</div>
                <div className="text-sm text-muted-foreground">
                  {getGameTypeDescription(type)}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Create Button */}
        <Button
          onClick={handleCreateGame}
          disabled={!selectedSetId || isCreating || sets.length === 0}
          className="w-full h-12 text-lg"
        >
          {isCreating ? (
            <>Creating...</>
          ) : (
            <>
              <Play className="h-5 w-5 mr-2" />
              Create Game
            </>
          )}
        </Button>

        {selectedSet && (
          <p className="text-sm text-center text-muted-foreground">
            This game will use <strong>{selectedSet.cards.length}</strong> terms
            from <strong>{selectedSet.title}</strong>
          </p>
        )}
      </div>
    </div>
  );
}
