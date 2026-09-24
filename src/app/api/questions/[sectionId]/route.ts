import { NextResponse } from "next/server";
import { QuestionsResponseSchema } from "@/types/question";
import { verifySessionFromRequest } from "@/lib/server-auth";
import { logger } from "@/utils/logger";
import { shuffle } from "@/utils/random";
import {
  mapSectionId,
  generateQuestions,
  labelAndShuffle,
  generateReadingPassage,
  DEFAULT_READING_PASSAGE,
  type Question,
} from "@/lib/ai/question-generation";
import { MOCK_QUESTIONS } from "@/constants/mockQuestions";

function getMockPool(sectionId: string): Question[] | undefined {
  return MOCK_QUESTIONS[sectionId as keyof typeof MOCK_QUESTIONS];
}

/** Label + shuffle each mock question's options, then pick a random subset */
function pickMockQuestions(pool: Question[], count: number): Question[] {
  const prepared = pool.map(labelAndShuffle);
  if (count >= prepared.length) return prepared;
  return shuffle(prepared).slice(0, count);
}

function invalidFormatResponse() {
  return NextResponse.json({ error: "Invalid response format" }, { status: 500 });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sectionId: string }> }
) {
  const { sectionId } = await params;

  // Get count from URL query parameters
  const url = new URL(request.url);
  const countParam = url.searchParams.get("count");
  const count = countParam ? parseInt(countParam, 10) : 3;

  // Limit count to a maximum of 20 questions
  const questionCount = Math.min(Math.max(1, count), 20);

  logger.info(`Generating ${questionCount} questions for section ${sectionId}`);

  try {
    const session = await verifySessionFromRequest(request);

    // Generate a reading passage if this is the reading section
    const readingPassage =
      sectionId === "reading" ? await generateReadingPassage() : null;

    // Try to generate AI questions first for authenticated users
    const aiQuestions = session
      ? await generateQuestions(mapSectionId(sectionId), questionCount, sectionId)
      : [];

    if (aiQuestions.length > 0) {
      const parsed = QuestionsResponseSchema.safeParse({
        questions: aiQuestions.map(labelAndShuffle),
        readingPassage,
      });
      if (!parsed.success) {
        logger.error("Invalid questions response:", parsed.error);
        return invalidFormatResponse();
      }
      return NextResponse.json(parsed.data);
    }

    // Fallback to mock questions if AI generation fails
    const pool = getMockPool(sectionId);
    if (!pool) {
      return NextResponse.json(
        { error: `Section ${sectionId} not found` },
        { status: 404 }
      );
    }
    if (pool.length === 0) {
      logger.error(`No mock questions found for section: ${sectionId}`);
      return NextResponse.json(
        { error: "No questions available for this section" },
        { status: 404 }
      );
    }

    const parsed = QuestionsResponseSchema.safeParse({
      questions: pickMockQuestions(pool, questionCount),
      readingPassage,
    });
    if (!parsed.success) {
      logger.error("Invalid mock questions response:", parsed.error);
      return invalidFormatResponse();
    }
    return NextResponse.json(parsed.data);
  } catch (error) {
    logger.error("Error in questions API:", error);

    // Fallback to mock questions in case of any error
    const pool = getMockPool(sectionId);
    if (pool && pool.length > 0) {
      return NextResponse.json({
        questions: pickMockQuestions(pool, questionCount),
        readingPassage: sectionId === "reading" ? DEFAULT_READING_PASSAGE : null,
      });
    }

    return NextResponse.json(
      { error: "Failed to retrieve questions" },
      { status: 500 }
    );
  }
}
