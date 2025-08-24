"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type AnswerMap = Record<string, string>;

type PracticeSessionState = {
  sectionId: string | null;
  questionIds: string[];
  currentIndex: number;
  answers: AnswerMap;
  startedAt: number | null;
  setSection: (sectionId: string) => void;
  start: (questionIds: string[]) => void;
  answer: (questionId: string, answer: string) => void;
  next: () => void;
  reset: () => void;
};

export const usePracticeSessionStore = create<PracticeSessionState>()(
  persist(
    (set, get) => ({
      sectionId: null,
      questionIds: [],
      currentIndex: 0,
      answers: {},
      startedAt: null,
      setSection: (sectionId) => set({ sectionId }),
      start: (questionIds) =>
        set({
          questionIds,
          currentIndex: 0,
          answers: {},
          startedAt: Date.now(),
        }),
      answer: (questionId, answer) =>
        set({ answers: { ...get().answers, [questionId]: answer } }),
      next: () =>
        set({
          currentIndex: Math.min(
            get().currentIndex + 1,
            get().questionIds.length - 1
          ),
        }),
      reset: () =>
        set({
          sectionId: null,
          questionIds: [],
          currentIndex: 0,
          answers: {},
          startedAt: null,
        }),
    }),
    { name: "practice-session" }
  )
);
