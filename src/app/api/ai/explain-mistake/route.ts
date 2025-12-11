import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextRequest } from "next/server";
import { z } from "zod";
import { validateRequest, CommonSchemas } from "@/utils/apiValidation";

const ExplainMistakeSchema = z.object({
  question: z.string().min(1, "Question is required"),
  userAnswer: z.string().min(1, "User answer is required"),
  correctAnswer: z.string().min(1, "Correct answer is required"),
  sectionId: CommonSchemas.sectionId,
});

export async function POST(request: NextRequest) {
  const validation = await validateRequest(request, ExplainMistakeSchema);
  if (!validation.success) return validation.error;

  const { question, userAnswer, correctAnswer, sectionId } = validation.data;

  const prompt = `
You are a supportive SAT tutor.
Question: ${question}
Student answer: ${userAnswer}
Correct answer: ${correctAnswer}
Section: ${sectionId}

Explain why the student's answer is incorrect, highlight the misconception, and provide a follow-up tip.
Limit to three short paragraphs and a final actionable bullet list.
`;

  const streamResult = await streamText({
    model: openai("gpt-4o-mini"),
    prompt,
  });

  return streamResult.toTextStreamResponse();
}
