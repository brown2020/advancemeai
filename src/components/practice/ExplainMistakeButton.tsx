"use client";

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
      <Button onClick={handleClick} disabled={isStreaming} variant="outline">
        {isStreaming ? "Explaining..." : "Explain my mistake"}
      </Button>
      {content && (
        <div className="rounded border border-muted p-3 text-sm whitespace-pre-wrap">
          {content}
        </div>
      )}
    </div>
  );
}
