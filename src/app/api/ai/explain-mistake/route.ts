import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { question, userAnswer, correctAnswer, sectionId } = await request.json();

  const prompt = `
You are a supportive SAT tutor.
Question: ${question}
Student answer: ${userAnswer}
Correct answer: ${correctAnswer}
Section: ${sectionId}

Explain why the student's answer is incorrect, highlight the misconception, and provide a follow-up tip.
Limit to three short paragraphs and a final actionable bullet list.
`;

  const result = await streamText({
    model: openai("gpt-4o-mini"),
    prompt,
  });

  return result.toTextStreamResponse();
}

