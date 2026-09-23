import type { FlashcardVisibility } from "@/types/flashcard";

export type ImageField = "termImageUrl" | "definitionImageUrl";
export type TextField = "term" | "definition";

/**
 * A card row in the set editor. `key` is a client-only stable identity used
 * for React keys, focus management and image storage paths; `id`/`createdAt`
 * are carried through for cards that already exist in Firestore.
 */
export interface EditorCard {
  key: string;
  id?: string;
  createdAt?: number;
  term: string;
  definition: string;
  termImageUrl?: string;
  definitionImageUrl?: string;
}

export interface SetEditorValues {
  title: string;
  description: string;
  visibility: FlashcardVisibility;
  cards: EditorCard[];
}

/** Minimum number of cards a set may have (enforced when removing rows). */
export const MIN_CARDS = 2;

function createKey(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `card_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createEditorCard(
  card: Partial<Omit<EditorCard, "key">> = {}
): EditorCard {
  return { term: "", definition: "", ...card, key: createKey() };
}

export function isCardFilled(card: Pick<EditorCard, TextField>): boolean {
  return Boolean(card.term.trim() && card.definition.trim());
}

export function hasAnyContent(cards: EditorCard[]): boolean {
  return cards.some((c) => c.term.trim() || c.definition.trim());
}
