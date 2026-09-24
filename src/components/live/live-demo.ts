import type { Flashcard } from "@/types/flashcard";
import { shuffle } from "@/utils/random";

export type DemoQuestion = {
  id: string;
  term: string;
  options: string[];
  correctIndex: number;
};

const DEMO_ROUND_LENGTH = 5;

/**
 * Local multiple-choice questions for the single-device demo round:
 * each card's term with its definition plus three other definitions.
 */
export function buildDemoQuestions(cards: Flashcard[], count = DEMO_ROUND_LENGTH): DemoQuestion[] {
  const usable = cards.filter((c) => c.term.trim() && c.definition.trim());
  if (usable.length < 4) return [];

  return shuffle(usable)
    .slice(0, count)
    .map((card) => {
      const distractors = shuffle(
        Array.from(
          new Set(usable.filter((c) => c.id !== card.id).map((c) => c.definition))
        ).filter((d) => d !== card.definition)
      ).slice(0, 3);
      const options = shuffle([card.definition, ...distractors]);
      return {
        id: card.id,
        term: card.term,
        options,
        correctIndex: options.indexOf(card.definition),
      };
    });
}
