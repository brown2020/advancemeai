"use client";

import { PageContainer, PageHeader, ErrorDisplay } from "@/components/common/UIComponents";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageContainer>
      <PageHeader title="Something went wrong" />
      <ErrorDisplay message={error.message || "Unexpected error"} />
      <Button type="button" variant="outline" onClick={reset}>
        Try again
      </Button>
    </PageContainer>
  );
}

