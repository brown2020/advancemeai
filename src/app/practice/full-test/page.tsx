import type { Metadata } from "next";
import { Suspense } from "react";
import {
  PageContainer,
  PageHeader,
  LoadingState,
} from "@/components/common/UIComponents";
import { getServerSession } from "@/lib/server-session";
import { SignInGate, SignInGateIcons } from "@/components/auth/SignInGate";
import FullTestClient from "./FullTestClient";


export const metadata: Metadata = {
  title: "Full-length Digital SAT | AdvanceMe AI",
  description: "Take a full-length practice test",
};

function FullTestFallback() {
  return (
    <PageContainer>
      <PageHeader eyebrow="SAT Prep" title="Full-length Digital SAT" />
      <LoadingState message="Loading your full test..." />
    </PageContainer>
  );
}

export default async function FullTestPage() {
  const { isAvailable, user } = await getServerSession();
  const authIsGuaranteed = Boolean(isAvailable && user);

  if (isAvailable && !user) {
    return (
      <PageContainer>
        <PageHeader eyebrow="SAT Prep" title="Full-length Digital SAT" />
        <SignInGate
          title="Sign in to start a full-length test"
          description="Your results and study plan will be saved to your account."
          icon={SignInGateIcons.practice}
        />
      </PageContainer>
    );
  }

  return (
    <Suspense fallback={<FullTestFallback />}>
      <FullTestClient authIsGuaranteed={authIsGuaranteed} />
    </Suspense>
  );
}
