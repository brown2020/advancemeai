"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Question } from "@/types/question";
import { useStreamingResponse } from "@/hooks/useStreamingResponse";

type StreamingQuestionGeneratorProps = {
  sectionId: string;
  onQuestion: (question: Question) => void;
  difficulty?: string;
};

export function StreamingQuestionGenerator({
  sectionId,
  onQuestion,
  difficulty = "medium",
}: StreamingQuestionGeneratorProps) {
  const [status, setStatus] = useState<string>("");
  const { isStreaming, content, streamResponse } = useStreamingResponse();

  const handleGenerate = async () => {
    setStatus("");

    const response = await fetch("/api/ai/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectionId, difficulty }),
    });

    const result = await streamResponse(response);

    if (result) {
      try {
        const parsed = JSON.parse(result) as Question;
        onQuestion(parsed);
        setStatus("Added streamed question to session.");
      } catch {
        setStatus("Failed to parse streamed question.");
      }
    }
  };

  return (
    <div className="space-y-2 rounded-md border border-dashed p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Generate a live AI question (streaming beta)
        </p>
        <Button onClick={handleGenerate} disabled={isStreaming}>
          {isStreaming ? "Streaming..." : "Stream Question"}
        </Button>
      </div>
      {(content || status) && (
        <div className="text-xs whitespace-pre-wrap text-muted-foreground">
          {content || status}
        </div>
      )}
    </div>
  );
}
