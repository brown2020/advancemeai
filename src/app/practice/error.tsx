"use client";

import { PageContainer, PageHeader, ErrorDisplay } from "@/components/common/UIComponents";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageContainer>
      <PageHeader title="SAT Practice Tests" />
      <ErrorDisplay message={error.message || "Something went wrong."} />
      <Button type="button" variant="outline" onClick={reset}>
        Try again
      </Button>
    </PageContainer>
  );
}

