import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { validateRequest, CommonSchemas } from "@/utils/apiValidation";
import { preprocessQuestion, shuffleOptions } from "@/lib/ai/question-generation";
import { MOCK_QUESTIONS } from "@/constants/mockQuestions";

const QuestionRequestSchema = z.object({
  sectionId: CommonSchemas.sectionId,
  difficulty: CommonSchemas.difficulty.default("medium"),
  readingPassage: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const validation = await validateRequest(request, QuestionRequestSchema);
  if (!validation.success) return validation.error;

  const { sectionId, difficulty, readingPassage } = validation.data;

  const baseSchema = `Fields:
{
  "id": "string",
  "text": "string",
  "options": ["A) ...","B) ...","C) ...","D) ..."],
  "correctAnswer": "one of the options exactly (A/B/C/D)",
  "explanation": "string",
  "difficulty": "${difficulty}"
}
Rules:
- The correct answer should not always be A.
- Do not mention option letters (A/B/C/D) in the explanation; explain using the content.
Respond with JSON only.`;

  const prompt =
    sectionId === "reading" && readingPassage
      ? `You are generating ONE SAT Reading question based ONLY on the passage below.

PASSAGE:
"""
${readingPassage}
"""

Requirements:
- The question must be answerable using evidence from the passage.
- Avoid outside knowledge.
- Keep SAT tone and difficulty: ${difficulty}.

${baseSchema}`
      : `Generate exactly one SAT ${sectionId} question as JSON.

${baseSchema}`;

  try {
    const result = await generateText({
      model: openai("gpt-4.1-mini"),
      prompt,
    });

    const raw = result.text?.trim() ?? "";
    const clean = raw.replace(/```json\n?|\n?```/g, "").trim();

    const parsed = JSON.parse(clean) as {
      id?: string;
      text: string;
      options: string[];
      correctAnswer: string;
      explanation?: string;
      difficulty?: string | number;
    };

    const withId = {
      ...parsed,
      id: parsed.id || `ai-${sectionId}-${Date.now()}`,
      difficulty,
    };

    // Ensure consistent labels + randomize option order so the correct letter
    // is not always "A)".
    const normalized = preprocessQuestion(withId as any);
    const shuffled = shuffleOptions(normalized as any);

    return NextResponse.json(shuffled);
  } catch {
    // Fallback: return a single shuffled mock question for this section.
    const sectionKey = sectionId as keyof typeof MOCK_QUESTIONS;
    const pool = MOCK_QUESTIONS[sectionKey] ?? [];
    if (!pool.length) {
      return NextResponse.json(
        { error: "Failed to generate a valid question" },
        { status: 500 }
      );
    }

    const picked = pool[Math.floor(Math.random() * pool.length)];
    const normalized = preprocessQuestion({
      ...picked,
      id: `mock-next-${sectionId}-${Date.now()}`,
      difficulty,
    } as any);
    const shuffled = shuffleOptions(normalized as any);
    return NextResponse.json(shuffled);
  }
}
