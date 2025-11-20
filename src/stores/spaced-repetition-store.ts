"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type BookmarkCard = {
  id: string;
  front: string;
  back: string;
  sectionId: string;
  addedAt: number;
};

type SpacedRepetitionState = {
  bookmarks: BookmarkCard[];
  addBookmark: (card: BookmarkCard) => void;
  removeBookmark: (cardId: string) => void;
  clearBookmarks: () => void;
};

export const useSpacedRepetitionStore = create<SpacedRepetitionState>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      addBookmark: (card) => {
        const existing = get().bookmarks.some(
          (bookmark) => bookmark.id === card.id
        );
        if (existing) return;
        set({ bookmarks: [...get().bookmarks, card] });
      },
      removeBookmark: (cardId) =>
        set({
          bookmarks: get().bookmarks.filter((bookmark) => bookmark.id !== cardId),
        }),
      clearBookmarks: () => set({ bookmarks: [] }),
    }),
    { name: "spaced-repetition-bookmarks" }
  )
);

