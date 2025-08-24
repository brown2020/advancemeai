"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/auth";
import {
  getAllTestSections,
  type TestSection,
} from "@/services/practiceTestService";
import {
  PageContainer,
  PageHeader,
  LoadingState,
  ErrorDisplay,
  CardGrid,
} from "@/components/common/UIComponents";
import { SectionCard } from "@/components/practice/SectionCard";
import { SignInGate } from "@/components/auth/SignInGate";
import { logger } from "@/utils/logger";
import { env } from "@/config/env";
import { useTestMode } from "@/hooks/useTestMode";

const PracticeDebug = dynamic(() => import("./debug"), { ssr: false });

export default function PracticePage() {
  const { user } = useAuth();
  const [sections, setSections] = useState<TestSection[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState<boolean>(() => env.debug);
  const isTestMode = useTestMode();
  const canPractice = Boolean(user) || isTestMode;
  const debugEnabled = env.debug;

  useEffect(() => {
    if (!user && !isTestMode) return;

    let isCancelled = false;
    setError(null);
    setLoading(true);

    getAllTestSections()
      .then((data) => {
        if (!isCancelled) setSections(data);
      })
      .catch((err) => {
        logger.error("Error fetching sections", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch practice test sections"
        );
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [user, isTestMode]);

  if (!canPractice) {
    return (
      <PageContainer>
        <PageHeader title="SAT Practice Tests" />

        {debugEnabled && (
          <div className="text-right mb-4">
            <button
              onClick={() => setShowDebug(!showDebug)}
              aria-pressed={showDebug}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {showDebug ? "Hide Debug Info" : "Show Debug Info"}
            </button>
          </div>
        )}

        {debugEnabled && showDebug && <PracticeDebug />}

        <SignInGate />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="SAT Practice Tests" />

      {/* Debug toggle button */}
      {debugEnabled && (
        <div className="text-right mb-4">
          <button
            onClick={() => setShowDebug(!showDebug)}
            aria-pressed={showDebug}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {showDebug ? "Hide Debug Info" : "Show Debug Info"}
          </button>
        </div>
      )}

      {/* Debug information - shown conditionally */}
      {debugEnabled && showDebug && <PracticeDebug />}

      {!canPractice ? (
        <SignInGate />
      ) : (
        <>
          <div className="text-center mb-8">
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Choose a section to practice. Our AI-powered system will adapt to
              your skill level and help you improve your performance.
            </p>
          </div>

          {error && <ErrorDisplay message={error} />}

          {error && <ErrorDisplay message={error} />}

          {!error && loading && (
            <LoadingState message="Loading practice test sections..." />
          )}

          {!error && !loading && sections.length === 0 && (
            <div className="text-center text-gray-600 dark:text-gray-300">
              No practice sections are available yet. Please check back soon.
            </div>
          )}

          {!error && !loading && sections.length > 0 && (
            <CardGrid>
              {sections.map((section) => (
                <SectionCard key={section.id} section={section} />
              ))}
            </CardGrid>
          )}
        </>
      )}
    </PageContainer>
  );
}
