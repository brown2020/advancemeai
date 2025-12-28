"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type UserId = string;
type SetId = string;
type CardId = string;

type StudyProgress = {
  /**
   * Mastery score per card.
   * 0 = unseen/unknown, 1 = learning, 2 = familiar, 3 = mastered
   */
  masteryByCardId: Record<CardId, 0 | 1 | 2 | 3>;
  updatedAt: number;
};

type FlashcardStudyState = {
  starredBySetId: Record<SetId, Record<CardId, true>>;
  progressByUserSetKey: Record<string, StudyProgress>;

  isStarred: (setId: SetId, cardId: CardId) => boolean;
  toggleStar: (setId: SetId, cardId: CardId) => void;

  getProgress: (userId: UserId, setId: SetId) => StudyProgress | null;
  hydrateProgress: (
    userId: UserId,
    setId: SetId,
    masteryByCardId: Record<CardId, 0 | 1 | 2 | 3>
  ) => void;
  setMastery: (
    userId: UserId,
    setId: SetId,
    cardId: CardId,
    mastery: 0 | 1 | 2 | 3
  ) => void;
  resetProgress: (userId: UserId, setId: SetId) => void;
};

function userSetKey(userId: string, setId: string) {
  return `${userId}:${setId}`;
}

export const useFlashcardStudyStore = create<FlashcardStudyState>()(
  persist(
    (set, get) => ({
      starredBySetId: {},
      progressByUserSetKey: {},

      isStarred: (setId, cardId) => Boolean(get().starredBySetId[setId]?.[cardId]),

      toggleStar: (setId, cardId) => {
        const current = get().starredBySetId[setId] ?? {};
        const isStarred = Boolean(current[cardId]);
        const nextForSet = { ...current };
        if (isStarred) {
          delete nextForSet[cardId];
        } else {
          nextForSet[cardId] = true;
        }
        set({
          starredBySetId: {
            ...get().starredBySetId,
            [setId]: nextForSet,
          },
        });
      },

      getProgress: (userId, setId) => {
        const key = userSetKey(userId, setId);
        return get().progressByUserSetKey[key] ?? null;
      },

      hydrateProgress: (userId, setId, masteryByCardId) => {
        const key = userSetKey(userId, setId);
        set({
          progressByUserSetKey: {
            ...get().progressByUserSetKey,
            [key]: { masteryByCardId, updatedAt: Date.now() },
          },
        });
      },

      setMastery: (userId, setId, cardId, mastery) => {
        const key = userSetKey(userId, setId);
        const current = get().progressByUserSetKey[key] ?? {
          masteryByCardId: {},
          updatedAt: Date.now(),
        };

        set({
          progressByUserSetKey: {
            ...get().progressByUserSetKey,
            [key]: {
              masteryByCardId: {
                ...current.masteryByCardId,
                [cardId]: mastery,
              },
              updatedAt: Date.now(),
            },
          },
        });
      },

      resetProgress: (userId, setId) => {
        const key = userSetKey(userId, setId);
        const next = { ...get().progressByUserSetKey };
        delete next[key];
        set({ progressByUserSetKey: next });
      },
    }),
    { name: "flashcard-study-v1" }
  )
);


