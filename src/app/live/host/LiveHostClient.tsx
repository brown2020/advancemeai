"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, redirect } from "next/navigation";
import { AlertTriangle, ArrowLeft, BookOpen, Check, Gamepad2, Play } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  EmptyState,
  LoadingState,
  PageContainer,
  PageHeader,
  SectionHeading,
} from "@/components/common/UIComponents";
import { LiveDemoBadge } from "@/components/live/LiveDemoBadge";
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
import { logger } from "@/utils/logger";

const HOSTABLE_GAME_TYPES: GameType[] = ["match", "blast"];
const MIN_CARDS = 4;

function BackLink() {
  return (
    <Link
      href="/live"
      className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" aria-hidden />
      Live
    </Link>
  );
}

function ChoiceCard({
  selected,
  onSelect,
  title,
  description,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border bg-card p-4 text-left shadow-card transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-primary bg-accent" : "border-border hover:border-primary/40"
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{title}</span>
        <span className="block text-sm text-muted-foreground">{description}</span>
      </span>
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
          selected ? "border-primary bg-primary text-primary-foreground" : "border-input"
        )}
        aria-hidden
      >
        {selected && <Check className="size-3.5" />}
      </span>
    </button>
  );
}

export default function LiveHostClient() {
  const router = useRouter();
  const { user, userProfile, isLoading: authLoading } = useAuth();

  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [gameType, setGameType] = useState<GameType>("match");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const canHost = isTeacher(userProfile);

  useEffect(() => {
    if (authLoading || !user) return;

    const loadSets = async () => {
      try {
        const userSets = await getUserFlashcardSets(user.uid);
        // Games need at least 4 cards to build answer choices.
        const validSets = userSets.filter((s) => s.cards.length >= MIN_CARDS);
        setSets(validSets);
        if (validSets[0]) setSelectedSetId(validSets[0].id);
      } catch (error) {
        logger.error("Failed to load sets:", error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadSets();
  }, [user, authLoading]);

  const handleCreateGame = () => {
    if (!selectedSetId || !user) return;
    setIsCreating(true);
    try {
      const code = generateGameCode();
      // Demo flow: game settings travel in the URL; there is no realtime sync yet.
      router.push(`/live/${code}?host=true&setId=${selectedSetId}&type=${gameType}`);
    } catch (error) {
      logger.error("Failed to create game:", error);
      setIsCreating(false);
    }
  };

  if (!authLoading && !user) {
    redirect("/auth/signin?returnTo=/live/host");
  }

  if (authLoading || isLoading) {
    return (
      <PageContainer width="narrow">
        <LoadingState message="Loading your sets..." />
      </PageContainer>
    );
  }

  if (!canHost) {
    return (
      <PageContainer width="narrow">
        <BackLink />
        <EmptyState
          icon={<AlertTriangle />}
          title="Teacher account required"
          message="Only teachers can host live games. Update your role in your profile if you're a teacher."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/profile" className={buttonVariants()}>
                Update profile
              </Link>
              <Link href="/live" className={buttonVariants({ variant: "outline" })}>
                Join a game
              </Link>
            </div>
          }
        />
      </PageContainer>
    );
  }

  const selectedSet = sets.find((s) => s.id === selectedSetId);

  return (
    <PageContainer width="narrow" className="max-w-2xl">
      <BackLink />
      <PageHeader
        eyebrow={<LiveDemoBadge />}
        title="Host a live game"
        description="Pick a set and a game type, then share the code with your students."
      />

      <div className="space-y-8">
        <section>
          <SectionHeading title="Flashcard set" icon={<BookOpen />} />
          {sets.length === 0 ? (
            <EmptyState
              icon={<BookOpen />}
              title="No sets ready yet"
              message={`You need a flashcard set with at least ${MIN_CARDS} cards to host a game.`}
              actionLink="/flashcards/create"
              actionText="Create a set"
            />
          ) : (
            <div role="radiogroup" aria-label="Flashcard set" className="grid gap-2">
              {sets.map((set) => (
                <ChoiceCard
                  key={set.id}
                  selected={selectedSetId === set.id}
                  onSelect={() => setSelectedSetId(set.id)}
                  title={set.title}
                  description={`${set.cards.length} terms`}
                />
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionHeading title="Game type" icon={<Gamepad2 />} />
          <div role="radiogroup" aria-label="Game type" className="grid gap-2 sm:grid-cols-2">
            {HOSTABLE_GAME_TYPES.map((type) => (
              <ChoiceCard
                key={type}
                selected={gameType === type}
                onSelect={() => setGameType(type)}
                title={getGameTypeName(type)}
                description={getGameTypeDescription(type)}
              />
            ))}
          </div>
        </section>

        <div className="space-y-3">
          <Button
            size="lg"
            onClick={handleCreateGame}
            disabled={!selectedSetId || sets.length === 0}
            isLoading={isCreating}
            className="h-14 w-full text-lg"
          >
            {!isCreating && <Play aria-hidden />}
            {isCreating ? "Creating..." : "Create game"}
          </Button>
          {selectedSet && (
            <p className="text-center text-sm text-muted-foreground">
              Uses <strong className="text-foreground">{selectedSet.cards.length}</strong> terms
              from <strong className="text-foreground">{selectedSet.title}</strong>
            </p>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
