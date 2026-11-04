"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { PageContainer } from "@/components/common/UIComponents";
import { FullTestCard } from "@/components/practice/FullTestCard";
import { env } from "@/config/env";
import { useTestMode } from "@/hooks/useTestMode";
import type { TestSection } from "@/services/practiceTestService";
import {
  showPracticeLoading,
  usePracticeSections,
  viewerCanPractice,
} from "./practice-session";
import {
  HubHeader,
  PracticeDebugSlot,
  PracticeLoading,
  PracticeSectionHeading,
  PracticeSectionList,
  PracticeSignIn,
} from "./PracticeHubSections";

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
  const isTestMode = useTestMode(testParam);
  const { sections, loading, error } = usePracticeSections(
    user,
    isTestMode,
    initialSections
  );
  const [showDebug, setShowDebug] = useState(env.debug);
  const canPractice = viewerCanPractice(user, isTestMode);
  const toggleDebug = () => setShowDebug((shown) => !shown);
  const debugSlot = (
    <PracticeDebugSlot enabled={env.debug} showDebug={showDebug} onToggle={toggleDebug} />
  );

  if (showPracticeLoading(isAuthLoading, isTestMode)) {
    return <PracticeLoading authIsGuaranteed={authIsGuaranteed} />;
  }

  if (!canPractice) {
    return <PracticeSignIn authIsGuaranteed={authIsGuaranteed} debugSlot={debugSlot} />;
  }

  return (
    <PageContainer>
      <HubHeader />
      {debugSlot}
      <FullTestCard />
      <PracticeSectionHeading />
      <PracticeSectionList error={error} loading={loading} sections={sections} />
    </PageContainer>
  );
}
