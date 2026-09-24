import { NextResponse } from "next/server";
import { errorResponse } from "@/utils/apiValidation";
import { verifySessionFromRequest } from "@/lib/server-auth";
import { logger } from "@/utils/logger";
import {
  generateQuestion,
  type Difficulty,
} from "@/lib/ai/question-generation";
import { MOCK_QUESTIONS } from "@/constants/mockQuestions";

export async function POST(request: Request) {
  const session = await verifySessionFromRequest(request);
  if (!session) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    const { section, difficulty, previousQuestions } = await request.json();

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
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Internal server error",
        error:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
