"use client";

import { createContext, useContext } from "react";
import type { StudyMode } from "@/types/flashcard";

type StudySessionContextValue = {
  mode: StudyMode;
  /** Leave the study mode and return to the set page. */
  exit: () => void;
  /** Jump straight to another study mode. */
  switchMode: (mode: StudyMode) => void;
};

const StudySessionContext = createContext<StudySessionContextValue | null>(null);

export const StudySessionProvider = StudySessionContext.Provider;

/** Access the surrounding study session (null when rendered standalone). */
export function useStudySession(): StudySessionContextValue | null {
  return useContext(StudySessionContext);
}
