"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Question } from "@/services/practiceTestService";

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
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStatus("");

    const response = await fetch("/api/ai/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectionId, difficulty }),
    });

    if (!response.body) {
      setIsGenerating(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value);
      setStatus(buffer);
    }

    try {
      const parsed = JSON.parse(buffer) as Question;
      onQuestion(parsed);
      setStatus("Added streamed question to session.");
    } catch (error) {
      setStatus("Failed to parse streamed question.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-2 rounded-md border border-dashed p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Generate a live AI question (streaming beta)
        </p>
        <Button onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? "Streaming..." : "Stream Question"}
        </Button>
      </div>
      {status && (
        <div className="text-xs whitespace-pre-wrap text-muted-foreground">
          {status}
        </div>
      )}
    </div>
  );
}

