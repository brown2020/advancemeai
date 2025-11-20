"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState("");

  const handleClick = async () => {
    setIsLoading(true);
    setExplanation("");
    const response = await fetch("/api/ai/explain-mistake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, userAnswer, correctAnswer, sectionId }),
    });
    if (!response.body) {
      setIsLoading(false);
      return;
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      result += decoder.decode(value);
      setExplanation(result);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-2">
      <Button onClick={handleClick} disabled={isLoading} variant="outline">
        {isLoading ? "Explaining..." : "Explain my mistake"}
      </Button>
      {explanation && (
        <div className="rounded border border-muted p-3 text-sm whitespace-pre-wrap">
          {explanation}
        </div>
      )}
    </div>
  );
}

