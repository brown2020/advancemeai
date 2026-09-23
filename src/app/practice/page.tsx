import type { Metadata } from "next";
import { Suspense } from "react";
import {
  PageContainer,
  PageHeader,
  LoadingState,
} from "@/components/common/UIComponents";
import PracticeClient from "./PracticeClient";
import { getServerSession } from "@/lib/server-session";
import { env } from "@/config/env";
import { SignInGate, SignInGateIcons } from "@/components/auth/SignInGate";
import type { TestSection } from "@/services/practiceTestService";

export const metadata: Metadata = {
  title: "SAT Prep | AdvanceMe AI",
  description: "Adaptive, AI-generated SAT practice and full-length tests",
};

const INITIAL_SECTIONS: TestSection[] = [
  {
    id: "reading",
    title: "Reading",
    description:
      "Passage-based comprehension, evidence, and inference questions.",
    questionCount: 0,
    timeLimit: 0,
  },
  {
    id: "writing",
    title: "Writing",
    description: "Grammar, punctuation, and rhetorical choices in context.",
    questionCount: 0,
    timeLimit: 0,
  },
  {
    id: "math-no-calc",
    title: "Math (No Calculator)",
    description: "Algebra and reasoning you can work out by hand.",
    questionCount: 0,
    timeLimit: 0,
  },
  {
    id: "math-calc",
    title: "Math (Calculator)",
    description: "Data analysis, advanced math, and multi-step problems.",
    questionCount: 0,
    timeLimit: 0,
  },
];

function PracticeFallback() {
  return (
    <PageContainer>
      <PageHeader eyebrow="SAT Prep" title="Practice that adapts to you" />
      <LoadingState message="Loading practice tests..." />
    </PageContainer>
  );
}

export default async function PracticePage({
  searchParams,
}: {
  searchParams?: Promise<{ test?: string | string[] }>;
}) {
  const { isAvailable, user } = await getServerSession();
  const authIsGuaranteed = Boolean(isAvailable && user);
  const sp = await searchParams;
  const rawTest = Array.isArray(sp?.test) ? sp?.test?.[0] : sp?.test;
  const isTestMode = env.allowTestMode && rawTest === "true";

  // If we can verify sessions server-side, render the gate before paint.
  if (isAvailable && !user && !isTestMode) {
    return (
      <PageContainer>
        <PageHeader eyebrow="SAT Prep" title="Practice that adapts to you" />
        <SignInGate
          title="Sign in to start SAT Prep"
          description="Our AI-powered practice tests are personalized to your skill level and help you improve gradually."
          icon={SignInGateIcons.practice}
        />
      </PageContainer>
    );
  }

  return (
    <Suspense fallback={<PracticeFallback />}>
      <PracticeClient
        authIsGuaranteed={authIsGuaranteed}
        initialSections={INITIAL_SECTIONS}
        testParam={rawTest}
      />
    </Suspense>
  );
}
