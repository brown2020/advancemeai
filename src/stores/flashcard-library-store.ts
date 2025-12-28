"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type FlashcardLibraryState = {
  recentSetIds: string[];
  addRecentSet: (setId: string) => void;
  clearRecent: () => void;
};

export const useFlashcardLibraryStore = create<FlashcardLibraryState>()(
  persist(
    (set, get) => ({
      recentSetIds: [],
      addRecentSet: (setId) => {
        if (!setId) return;
        const current = get().recentSetIds;
        const next = [setId, ...current.filter((id) => id !== setId)].slice(0, 20);
        set({ recentSetIds: next });
      },
      clearRecent: () => set({ recentSetIds: [] }),
    }),
    { name: "flashcard-library-v1" }
  )
);


