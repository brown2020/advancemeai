import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const QuestionRequestSchema = z.object({
  sectionId: z.enum(["reading", "writing", "math-calc", "math-no-calc"]),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = QuestionRequestSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid request", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { sectionId, difficulty } = result.data;

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
