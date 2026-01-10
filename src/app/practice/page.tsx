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
      <PracticeClient authIsGuaranteed={authIsGuaranteed} />
    </Suspense>
  );
}
