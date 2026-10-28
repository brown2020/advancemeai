import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse } from "@/utils/apiValidation";
import { requireAiUser } from "@/lib/ai/access";
import { logger } from "@/utils/logger";
import {
  generateQuestion,
  type Difficulty,
} from "@/lib/ai/question-generation";
import { MOCK_QUESTIONS } from "@/constants/mockQuestions";

const questionRequestSchema = z.object({
  section: z.string().trim().min(1).max(40),
  difficulty: z.number().min(1).max(5),
  previousQuestions: z.array(z.string().max(200)).max(100).optional().default([]),
});

export async function POST(request: Request) {
  const access = await requireAiUser(request);
  if (!access.ok) return access.response;

  try {
    const body = await request.json().catch(() => null);
    const parsed = questionRequestSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Invalid question request", 400);
    }
    const { section, difficulty, previousQuestions } = parsed.data;

    try {
      const question = await generateQuestion(section, difficulty as Difficulty);
      logger.debug("Successfully generated AI question:", question);
      return NextResponse.json(question);
    } catch (aiError) {
      logger.error("AI generation failed:", aiError);

      // Get section-specific questions
      const sectionQuestions = MOCK_QUESTIONS[section.toLowerCase()] || [];

      if (sectionQuestions.length === 0) {
        throw new Error(`No questions available for section: ${section}`);
      }

      // Improved fallback question selection
      let availableQuestions = sectionQuestions.filter((q) => {
        return (
          !previousQuestions.includes(q.id) &&
          Math.abs(Number(q.difficulty) - difficulty) <= 1
        );
      });

      // If no questions available with ideal difficulty, expand the range
      if (availableQuestions.length === 0) {
        availableQuestions = sectionQuestions.filter(
          (q) => !previousQuestions.includes(q.id)
        );
      }

      // If all questions have been used, reset and use all questions
      if (availableQuestions.length === 0) {
        availableQuestions = sectionQuestions;
        logger.warn("All questions have been used, resetting question pool");
      }

      const randomQuestion =
        availableQuestions[
          Math.floor(Math.random() * availableQuestions.length)
        ];

      if (!randomQuestion) {
        throw new Error("No questions available after filtering");
      }

      return NextResponse.json(randomQuestion);
    }
  } catch (error) {
    logger.error("Error in questions API:", error);
    return errorResponse("Failed to retrieve a question", 500);
  }
}
