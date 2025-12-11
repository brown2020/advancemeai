import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextRequest } from "next/server";
import { z } from "zod";
import { validateRequest, CommonSchemas } from "@/utils/apiValidation";

const QuestionRequestSchema = z.object({
  sectionId: CommonSchemas.sectionId,
  difficulty: CommonSchemas.difficulty.default("medium"),
});

export async function POST(request: NextRequest) {
  const validation = await validateRequest(request, QuestionRequestSchema);
  if (!validation.success) return validation.error;

  const { sectionId, difficulty } = validation.data;

  const prompt = `Generate exactly one SAT ${sectionId} question as JSON.
Fields:
{
  "id": "string",
  "text": "string",
  "options": ["A) ...","B) ...","C) ...","D) ..."],
  "correctAnswer": "A) ...",
  "explanation": "string",
  "difficulty": "${difficulty}"
}
Respond with JSON only.`;

  const streamResult = await streamText({
    model: openai("gpt-4o-mini"),
    prompt,
  });

  return streamResult.toTextStreamResponse();
}
