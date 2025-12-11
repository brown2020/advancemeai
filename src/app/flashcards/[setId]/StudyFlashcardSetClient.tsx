"use client";

import { useAuth } from "@/lib/auth";
import { useState, useEffect, useCallback, useMemo } from "react";
import { FlashcardSet, StudyMode } from "@/types/flashcard";
import { getFlashcardSet } from "@/services/flashcardService";
import { ROUTES } from "@/constants/appConstants";
import {
  PageContainer,
  PageHeader,
  LoadingState,
  ErrorDisplay,
  ActionLink,
} from "@/components/common/UIComponents";
import { Button } from "@/components/ui/button";

// Flashcard component
const Flashcard = ({
  term,
  definition,
  isFlipped,
  onFlip,
}: {
  term: string;
  definition: string;
  isFlipped: boolean;
  onFlip: () => void;
}) => (
  <div
    className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 mb-6 min-h-[300px] flex items-center justify-center cursor-pointer transition-transform duration-500 transform hover:scale-105"
    onClick={onFlip}
    role="button"
    tabIndex={0}
    aria-label={`Flashcard: ${isFlipped ? "definition" : "term"}`}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        onFlip();
        e.preventDefault();
      }
    }}
    style={{ perspective: "1000px" }}
  >
    {isFlipped ? (
      <div className="w-full text-center transition-transform duration-500">
        <h2 className="text-2xl font-bold mb-2">{definition}</h2>
        <p className="text-gray-500 text-sm mt-4">Click to see term</p>
      </div>
    ) : (
      <div className="w-full text-center transition-transform duration-500">
        <h2 className="text-2xl font-bold mb-2">{term}</h2>
        <p className="text-gray-500 text-sm mt-4">Click to see definition</p>
      </div>
    )}
  </div>
);

// Navigation Controls
const NavigationControls = ({
  onPrev,
  onNext,
  isFirst,
  isLast,
}: {
  onPrev: () => void;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}) => (
  <div className="flex justify-between">
    <Button onClick={onPrev} disabled={isFirst} variant="outline">
      Previous
    </Button>
    <Button onClick={onNext} disabled={isLast} variant="practice">
      Next
    </Button>
  </div>
);

// Study Mode Selector
const StudyModeSelector = ({
  activeMode,
  onSelectMode,
}: {
  activeMode: StudyMode;
  onSelectMode: (mode: StudyMode) => void;
}) => (
  <div className="flex gap-2">
    <Button
      onClick={() => onSelectMode("cards")}
      variant={activeMode === "cards" ? "default" : "outline"}
      size="sm"
    >
      Flashcards
    </Button>
    <Button
      onClick={() => onSelectMode("learn")}
      variant={activeMode === "learn" ? "default" : "outline"}
      size="sm"
    >
      Learn
    </Button>
    <Button
      onClick={() => onSelectMode("test")}
      variant={activeMode === "test" ? "default" : "outline"}
      size="sm"
    >
      Test
    </Button>
  </div>
);

// Coming Soon Message
const ComingSoonMessage = ({ feature }: { feature: string }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
    <p className="text-center text-lg mb-4">
      {feature} mode is coming soon! This mode will help you memorize cards
      through spaced repetition.
    </p>
  </div>
);

// Cards Study Mode
const CardStudyMode = ({
  currentCard,
  currentIndex,
  totalCards,
  isFlipped,
  onFlip,
  onPrev,
  onNext,
}: {
  currentCard: { term: string; definition: string } | null;
  currentIndex: number;
  totalCards: number;
  isFlipped: boolean;
  onFlip: () => void;
  onPrev: () => void;
  onNext: () => void;
}) => {
  if (!currentCard) return null;

  return (
    <>
      <div className="mb-4 text-center">
        <span className="text-gray-600 dark:text-gray-300">
          Card {currentIndex + 1} of {totalCards}
        </span>
      </div>

      <Flashcard
        term={currentCard.term}
        definition={currentCard.definition}
        isFlipped={isFlipped}
        onFlip={onFlip}
      />

      <NavigationControls
        onPrev={onPrev}
        onNext={onNext}
        isFirst={currentIndex === 0}
        isLast={currentIndex === totalCards - 1}
      />
    </>
  );
};

export default function StudyFlashcardSetClient({ setId }: { setId: string }) {
  const { user } = useAuth();
  const [set, setSet] = useState<FlashcardSet | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studyMode, setStudyMode] = useState<StudyMode>("cards");

  // Navigation callbacks
  const nextCard = useCallback(() => {
    if (set && currentCardIndex < set.cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    }
  }, [currentCardIndex, set]);

  const prevCard = useCallback(() => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  }, [currentCardIndex]);

  const flipCard = useCallback(() => {
    setIsFlipped(!isFlipped);
  }, [isFlipped]);

  // Get current card
  const currentCard = useMemo(
    () => (set && set.cards.length > 0 ? set.cards[currentCardIndex] : null),
    [set, currentCardIndex]
  );

  // Fetch flashcard set
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchFlashcardSet = async () => {
      try {
        const flashcardSet = await getFlashcardSet(setId);
        if (!isMounted) return;

        if (!flashcardSet) {
          setError("Flashcard set not found");
        } else {
          setSet(flashcardSet);
        }
      } catch (err) {
        if (!isMounted) return;
        // Error already handled by UI state
        setError("Failed to load flashcard set. Please try again.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchFlashcardSet();

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, [user, setId]);

  // Conditional rendering for different states
  if (!user) {
    return (
      <PageContainer>
        <PageHeader title="Study Flashcards" />
        <p>Please sign in to study flashcards.</p>
      </PageContainer>
    );
  }

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="Study Flashcards" />
        <LoadingState message="Loading flashcard set..." />
      </PageContainer>
    );
  }

  if (error || !set) {
    return (
      <PageContainer>
        <PageHeader title="Study Flashcards" />
        <ErrorDisplay message={error || "Flashcard set not found."} />
        <ActionLink href={ROUTES.FLASHCARDS.INDEX} className="mt-4">
          Back to Flashcards
        </ActionLink>
      </PageContainer>
    );
  }

  if (set.cards.length === 0) {
    return (
      <PageContainer>
        <PageHeader title="Study Flashcards" />
        <p>This flashcard set has no cards.</p>
        <ActionLink href={ROUTES.FLASHCARDS.INDEX} className="mt-4">
          Back to Flashcards
        </ActionLink>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <ActionLink href={ROUTES.FLASHCARDS.INDEX} variant="secondary">
          ← Back to Flashcards
        </ActionLink>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{set.title}</h1>
          <p className="text-gray-600 dark:text-gray-300">{set.description}</p>
        </div>
        <StudyModeSelector activeMode={studyMode} onSelectMode={setStudyMode} />
      </div>

      {studyMode === "cards" && (
        <CardStudyMode
          currentCard={currentCard}
          currentIndex={currentCardIndex}
          totalCards={set.cards.length}
          isFlipped={isFlipped}
          onFlip={flipCard}
          onPrev={prevCard}
          onNext={nextCard}
        />
      )}

      {studyMode === "learn" && <ComingSoonMessage feature="Learn" />}

      {studyMode === "test" && <ComingSoonMessage feature="Test" />}
    </PageContainer>
  );
}
