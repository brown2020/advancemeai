import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { sectionId, difficulty = "medium" } = await request.json();

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

  const result = await streamText({
    model: openai("gpt-4o-mini"),
    prompt,
  });

  return result.toTextStreamResponse();
}

