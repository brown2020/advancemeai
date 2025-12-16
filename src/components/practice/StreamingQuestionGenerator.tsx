"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { QuestionSchema, type Question } from "@/types/question";

type StreamingQuestionGeneratorProps = {
  sectionId: string;
  onQuestion: (question: Question) => void;
  difficulty?: string;
  readingPassage?: string;
};

export function StreamingQuestionGenerator({
  sectionId,
  onQuestion,
  difficulty = "medium",
  readingPassage,
}: StreamingQuestionGeneratorProps) {
  const [status, setStatus] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const inFlightRef = useRef(false);

  const handleGenerate = async () => {
    if (inFlightRef.current) return;
    setStatus("");
    setIsGenerating(true);
    inFlightRef.current = true;

    try {
      const response = await fetch("/api/ai/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId,
          difficulty,
          readingPassage: sectionId === "reading" ? readingPassage : undefined,
        }),
      });

      if (!response.ok) {
        setStatus("Failed to generate the next question.");
        return;
      }

      const json = await response.json();
      const validated = QuestionSchema.safeParse(json);
      if (validated.success) {
        onQuestion(validated.data);
        setStatus("Generated the next question.");
      } else {
        setStatus("Generated output, but it wasn't a valid question.");
      }
    } finally {
      inFlightRef.current = false;
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-2 rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">Generate the next question</p>
        <Button onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? "Generating..." : "Generate Next"}
        </Button>
      </div>
      {status && <div className="text-xs text-muted-foreground">{status}</div>}
    </div>
  );
}
