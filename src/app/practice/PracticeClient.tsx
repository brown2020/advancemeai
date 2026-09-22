"use client";

import { useEffect, useReducer } from "react";
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
  SectionContainer,
  ActionLink,
} from "@/components/common/UIComponents";
import { SectionCard } from "@/components/practice/SectionCard";
import { SignInGate, SignInGateIcons } from "@/components/auth/SignInGate";
import { logger } from "@/utils/logger";
import { env } from "@/config/env";
import { useTestMode } from "@/hooks/useTestMode";
import { ROUTES } from "@/constants/appConstants";

const PracticeDebug = dynamic(() => import("./debug"), { ssr: false });

export default function PracticeClient({
  authIsGuaranteed = false,
  initialSections,
  testParam,
}: {
  authIsGuaranteed?: boolean;
  initialSections?: TestSection[];
  testParam?: string;
}) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [state, dispatch] = useReducer((s: any, p: Record<string, any>): any => { const patch: Record<string, any> = {}; for (const key of Object.keys(p)) { const value = p[key]; patch[key] = typeof value === "function" ? value(s[key]) : value; } return { ...s, ...patch }; }, { sections: (initialSections ?? []) as TestSection[], loading: !initialSections, error: null as string | null, showDebug: env.debug, hasInitialRef: Boolean(initialSections) });
  const { sections, loading, error, showDebug, hasInitialRef } = state as any;
  const assignSections = (value: any | ((prev: any) => any)) => dispatch({ sections: value });
  const assignLoading = (value: any | ((prev: any) => any)) => dispatch({ loading: value });
  const assignError = (value: any | ((prev: any) => any)) => dispatch({ error: value });
  const assignShowDebug = (value: any | ((prev: any) => any)) => dispatch({ showDebug: value });
  const isTestMode = useTestMode(testParam);
  const canPractice = Boolean(user) || isTestMode;
  const debugEnabled = env.debug;

  useEffect(() => {
    if (!user && !isTestMode) return;
    if (hasInitialRef) return;

    let isCancelled = false;
    assignError(null);
    assignLoading(true);

    getAllTestSections()
      .then((data) => {
        if (!isCancelled) assignSections(data);
      })
      .catch((err) => {
        logger.error("Error fetching sections", err);
        assignError(
          err instanceof Error
            ? err.message
            : "Failed to fetch practice test sections"
        );
      })
      .finally(() => {
        if (!isCancelled) assignLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [hasInitialRef, user, isTestMode]);

  if (isAuthLoading && !isTestMode) {
    return (
      <PageContainer>
        <PageHeader title="SAT Practice Tests" />
        <LoadingState
          message={
            authIsGuaranteed ? "Loading practice tests..." : "Checking your session..."
          }
        />
      </PageContainer>
    );
  }

  if (!canPractice) {
    return (
      <PageContainer>
        <PageHeader title="SAT Practice Tests" />

        {debugEnabled && (
          <div className="text-right mb-4">
            <button
              onClick={() => assignShowDebug(!showDebug)}
              aria-pressed={showDebug}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {showDebug ? "Hide Debug Info" : "Show Debug Info"}
            </button>
          </div>
        )}

        {debugEnabled && showDebug && <PracticeDebug />}

        <SignInGate
          title="Sign in to access Practice Tests"
          description={
            authIsGuaranteed
              ? "Your session expired. Sign in again to access practice tests."
              : "Our AI-powered practice tests are personalized to your skill level and help you improve gradually."
          }
          icon={SignInGateIcons.practice}
          buttonStyle="practice"
        />
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
            onClick={() => assignShowDebug(!showDebug)}
            aria-pressed={showDebug}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {showDebug ? "Hide Debug Info" : "Show Debug Info"}
          </button>
        </div>
      )}

      {/* Debug information - shown conditionally */}
      {debugEnabled && showDebug && <PracticeDebug />}

      <div className="text-center mb-8">
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Choose a section to practice. Our AI-powered system will adapt to your
          skill level and help you improve your performance.
        </p>
      </div>

      <SectionContainer className="mb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Full-length Digital SAT</h2>
            <p className="text-sm text-muted-foreground">
              Take a complete, timed practice test and get a personalized study
              plan.
            </p>
          </div>
          <ActionLink href={ROUTES.PRACTICE.FULL_TEST} variant="primary">
            Start Full Test
          </ActionLink>
        </div>
      </SectionContainer>

      {error && <ErrorDisplay message={error} />}

      {!error && loading && (
        <LoadingState message="Loading practice test sections..." />
      )}

      {!error && !loading && sections.length === 0 && (
        <div className="text-center text-muted-foreground">
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
    </PageContainer>
  );
}

