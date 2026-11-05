import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { FAST_MODEL } from "@/lib/ai/openai";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { validateRequest, CommonSchemas, errorResponse } from "@/utils/apiValidation";
import { requireAiUser } from "@/lib/ai/access";
import {
  GENERATION_ATTEMPTS,
  assertGeneratedQuestion,
  deliverQuestion,
  type Question,
} from "@/lib/ai/question-generation";
import { MOCK_QUESTIONS } from "@/constants/mockQuestions";

const QuestionRequestSchema = z.object({
  sectionId: CommonSchemas.sectionId,
  difficulty: CommonSchemas.difficulty.default("medium"),
  readingPassage: z.string().max(8000).optional(),
});

export async function POST(request: NextRequest) {
  const access = await requireAiUser(request);
  if (!access.ok) return access.response;

  const validation = await validateRequest(request, QuestionRequestSchema);
  if (!validation.success) return validation.error;

  const { sectionId, difficulty, readingPassage } = validation.data;

  const baseSchema = `Fields:
{
  "id": "string",
  "text": "string",
  "options": ["A) ...","B) ...","C) ...","D) ..."],
  "correctAnswerIndex": 0,
  "correctAnswer": "the option at correctAnswerIndex, exactly",
  "explanation": "string",
  "difficulty": "${difficulty}"
}
Rules:
- Include exactly 4 options.
- correctAnswerIndex is the 0-based index of the correct option (0 is A, 3 is D) and must point at one of those options.
- The correct answer should not always be A.
- Write the explanation in this same response, together with correctAnswer.
- The value the explanation computes must appear in the options. Do not apologize that the choices do not match or say to re-calculate.
- "text" is the question stem only. Do not repeat the A–D choices inside the question text.
- Do not mention option letters (A/B/C/D) in the explanation; explain using the choice's wording.
- If you do name a choice letter, it must be the letter of correctAnswer, and do not also say that letter is wrong.
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

  const passage = sectionId === "reading" ? readingPassage : undefined;

  for (let attempt = 0; attempt < GENERATION_ATTEMPTS; attempt += 1) {
    try {
      const result = await generateText({
        model: openai(FAST_MODEL),
        prompt,
      });

      const raw = result.text?.trim() ?? "";
      const clean = raw.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = assertGeneratedQuestion(JSON.parse(clean));
      const delivered = deliverQuestion(
        {
          ...parsed,
          id: parsed.id === "generated" ? `ai-${sectionId}-${Date.now()}` : parsed.id,
          difficulty,
        },
        passage
      );
      if (!delivered) continue;
      return NextResponse.json(delivered);
    } catch {
      // Try again, then fall back to a consistent mock item.
    }
  }

  const sectionKey = sectionId as keyof typeof MOCK_QUESTIONS;
  const pool = MOCK_QUESTIONS[sectionKey] ?? [];
  for (const picked of pool) {
    const delivered = deliverQuestion(
      {
        ...picked,
        id: `mock-next-${sectionId}-${Date.now()}`,
        difficulty,
      } as Question,
      passage
    );
    if (delivered) return NextResponse.json(delivered);
  }

  return errorResponse("Failed to generate a valid question", 500);
}
