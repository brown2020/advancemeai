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

const INITIAL_SECTIONS: TestSection[] = [
  {
    id: "reading",
    title: "Reading",
    description:
      "Practice reading comprehension with AI-generated questions based on passages",
    questionCount: 0,
    timeLimit: 0,
  },
  {
    id: "writing",
    title: "Writing",
    description:
      "Improve your grammar and writing skills with AI-generated practice questions",
    questionCount: 0,
    timeLimit: 0,
  },
  {
    id: "math-no-calc",
    title: "Math (No Calculator)",
    description:
      "Practice math concepts without a calculator using AI-generated questions",
    questionCount: 0,
    timeLimit: 0,
  },
  {
    id: "math-calc",
    title: "Math (Calculator)",
    description:
      "Practice math problems with a calculator using AI-generated questions",
    questionCount: 0,
    timeLimit: 0,
  },
];

function PracticeFallback() {
  return (
    <PageContainer>
      <PageHeader title="SAT Practice Tests" />
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
        <PageHeader title="SAT Practice Tests" />
        <SignInGate
          title="Sign in to access Practice Tests"
          description="Our AI-powered practice tests are personalized to your skill level and help you improve gradually."
          icon={SignInGateIcons.practice}
          buttonStyle="practice"
        />
      </PageContainer>
    );
  }

  return (
    <Suspense fallback={<PracticeFallback />}>
      <PracticeClient
        authIsGuaranteed={authIsGuaranteed}
        initialSections={INITIAL_SECTIONS}
      />
    </Suspense>
  );
}
