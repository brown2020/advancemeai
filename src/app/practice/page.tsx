import { Suspense } from "react";
import { PageContainer, PageHeader, LoadingState } from "@/components/common/UIComponents";
import PracticeClient from "./PracticeClient";

function PracticeFallback() {
  return (
    <PageContainer>
      <PageHeader title="SAT Practice Tests" />
      <LoadingState message="Loading practice tests..." />
    </PageContainer>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<PracticeFallback />}>
      <PracticeClient />
    </Suspense>
  );
}
