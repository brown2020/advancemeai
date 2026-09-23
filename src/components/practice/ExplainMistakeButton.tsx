"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStreamingResponse } from "@/hooks/useStreamingResponse";

type ExplainMistakeButtonProps = {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  sectionId: string;
};

export function ExplainMistakeButton({
  question,
  userAnswer,
  correctAnswer,
  sectionId,
}: ExplainMistakeButtonProps) {
  const { isStreaming, content, streamResponse } = useStreamingResponse();

  const handleClick = async () => {
    const response = await fetch("/api/ai/explain-mistake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, userAnswer, correctAnswer, sectionId }),
    });
    await streamResponse(response);
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={handleClick}
        isLoading={isStreaming}
        variant="outline"
        size="sm"
      >
        {!isStreaming && <Sparkles aria-hidden />}
        {isStreaming ? "Explaining..." : "Explain my mistake"}
      </Button>
      {content && (
        <div
          aria-live="polite"
          className="whitespace-pre-wrap rounded-xl border border-border bg-card p-3 text-sm leading-relaxed"
        >
          {content}
        </div>
      )}
    </div>
  );
}
