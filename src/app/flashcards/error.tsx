"use client";

import { RotateCcw } from "lucide-react";
import {
  PageContainer,
  PageHeader,
  ErrorDisplay,
} from "@/components/common/UIComponents";
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
      <PageHeader title="Flashcards" />
      <ErrorDisplay
        message={error.message || "Something went wrong loading your library."}
      />
      <Button type="button" variant="outline" onClick={reset}>
        <RotateCcw aria-hidden />
        Try again
      </Button>
    </PageContainer>
  );
}
