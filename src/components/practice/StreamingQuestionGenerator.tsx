"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
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
    <div className="rounded-2xl border border-dashed border-border bg-card/60 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">Want another one?</p>
          <p className="text-xs text-muted-foreground">
            AI will generate a new question at your level.
          </p>
        </div>
        <Button
          type="button"
          variant="soft"
          size="sm"
          onClick={handleGenerate}
          isLoading={isGenerating}
        >
          {!isGenerating && <Plus aria-hidden />}
          {isGenerating ? "Generating..." : "Generate next"}
        </Button>
      </div>
      {status && (
        <p role="status" className="mt-2 text-xs text-muted-foreground">
          {status}
        </p>
      )}
    </div>
  );
}
