import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import {
  getAllTestSections,
  type TestSection,
} from "@/services/practiceTestService";
import { logger } from "@/utils/logger";

type PracticeViewer = { uid: string } | null;

type SectionLoadSetters = {
  setSections: Dispatch<SetStateAction<TestSection[]>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setError: Dispatch<SetStateAction<string | null>>;
};

export function viewerCanPractice(user: PracticeViewer, isTestMode: boolean): boolean {
  return Boolean(user) || isTestMode;
}

export function showPracticeLoading(isAuthLoading: boolean, isTestMode: boolean): boolean {
  return isAuthLoading && !isTestMode;
}

function sectionLoadError(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Failed to fetch practice test sections";
}

function fetchPracticeSections(setters: SectionLoadSetters): () => void {
  let isCancelled = false;
  setters.setError(null);
  setters.setLoading(true);

  getAllTestSections()
    .then((data) => {
      if (!isCancelled) setters.setSections(data);
    })
    .catch((err: unknown) => {
      logger.error("Error fetching sections", err);
      setters.setError(sectionLoadError(err));
    })
    .finally(() => {
      if (!isCancelled) setters.setLoading(false);
    });

  return () => {
    isCancelled = true;
  };
}

export function startPracticeSectionLoad(
  user: PracticeViewer,
  isTestMode: boolean,
  hasInitialSections: boolean,
  setters: SectionLoadSetters
): (() => void) | undefined {
  if (!user && !isTestMode) return;
  if (hasInitialSections) return;
  return fetchPracticeSections(setters);
}

export function usePracticeSections(
  user: PracticeViewer,
  isTestMode: boolean,
  initialSections: TestSection[] | undefined
) {
  const hasInitialSections = Boolean(initialSections);
  const [sections, setSections] = useState<TestSection[]>(initialSections ?? []);
  const [loading, setLoading] = useState(!initialSections);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return startPracticeSectionLoad(user, isTestMode, hasInitialSections, {
      setSections,
      setLoading,
      setError,
    });
  }, [hasInitialSections, user, isTestMode]);

  return { sections, loading, error };
}
