import { NextResponse } from "next/server";
import { QuestionsResponseSchema } from "@/types/question";
import { verifySessionFromRequest } from "@/lib/server-auth";
import { logger } from "@/utils/logger";
import {
  getOpenAIClient,
  mapSectionId,
  validateQuestion,
  cleanAIGeneratedQuestion,
  shuffleOptions,
  preprocessQuestion,
  generateReadingPassage,
  DEFAULT_READING_PASSAGE,
  buildQuestionPrompt,
  SYSTEM_PROMPT,
  type Difficulty,
  type Question,
} from "@/lib/ai/question-generation";
import { MOCK_QUESTIONS } from "@/constants/mockQuestions";

// Use shared mock questions
const mockQuestions = MOCK_QUESTIONS;

function pickRandomSubset<T>(items: T[], count: number): T[] {
  if (count >= items.length) return items;
  // Shallow copy + Fisher-Yates partial shuffle
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    const other = copy[j];
    if (temp !== undefined && other !== undefined) {
      copy[i] = other;
      copy[j] = temp;
    }
  }
  return copy.slice(0, count);
}

/**
 * Generate multiple AI questions for a section
 */
async function generateAIQuestions(
  sectionId: string,
  count: number = 3
): Promise<Question[]> {
  try {
    const section = mapSectionId(sectionId);
    const questions: Question[] = [];
    const openai = getOpenAIClient();

    for (let i = 0; i < count; i++) {
      try {
        const difficulty = (Math.floor(Math.random() * 5) + 1) as Difficulty;
        const prompt = buildQuestionPrompt(section, difficulty);

        const completion = await openai.chat.completions.create({
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          model: "gpt-4.1",
          temperature: 0.7,
        });

        const firstChoice = completion.choices[0];
        if (!firstChoice?.message?.content) {
          throw new Error("No content received from OpenAI");
        }
        const content = firstChoice.message.content;

        const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
        const question = JSON.parse(cleanContent);
        const validatedQuestion = validateQuestion(question, section);

        const cleanedQuestion = cleanAIGeneratedQuestion({
          ...validatedQuestion,
          id: `ai-${sectionId}-${i}-${Date.now()}`,
          difficulty: difficulty,
        });

        questions.push(cleanedQuestion);
        logger.debug(
          `Successfully generated AI question ${i + 1} for section ${sectionId}`
        );
      } catch (error) {
        logger.error(
          `Error generating question ${i + 1} for section ${sectionId}:`,
          error
        );
      }
    }

    return questions;
  } catch (error) {
    logger.error("Error generating AI questions:", error);
    return [];
  }
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
    const isAuthed = Boolean(session);

    // Generate a reading passage if this is the reading section
    let readingPassage: string | null = null;
    if (sectionId === "reading") {
      logger.debug("Generating reading passage");
      readingPassage = await generateReadingPassage();
      logger.debug("Reading passage generated successfully");
    }

    // Try to generate AI questions first for authenticated users
    const aiQuestions = isAuthed
      ? await generateAIQuestions(sectionId, questionCount)
      : [];

    // If we successfully generated AI questions, shuffle their options and return them
    if (aiQuestions && aiQuestions.length > 0) {
      const preprocessedQuestions = aiQuestions.map((question) =>
        preprocessQuestion(question)
      );
      const shuffledQuestions = preprocessedQuestions.map((question) =>
        shuffleOptions(question)
      );

      const payload = { questions: shuffledQuestions, readingPassage };
      const parsed = QuestionsResponseSchema.safeParse(payload);
      if (!parsed.success) {
        logger.error("Invalid questions response:", parsed.error);
        return NextResponse.json(
          { error: "Invalid response format" },
          { status: 500 }
        );
      }
      return NextResponse.json(parsed.data);
    }

    // Fallback to mock questions if AI generation fails
    if (!mockQuestions[sectionId as keyof typeof mockQuestions]) {
      return NextResponse.json(
        { error: `Section ${sectionId} not found` },
        { status: 404 }
      );
    }

    // Preprocess mock questions to add labels, then shuffle them
    const sectionQuestions = mockQuestions[sectionId as keyof typeof mockQuestions];
    if (!sectionQuestions || sectionQuestions.length === 0) {
      logger.error(`No mock questions found for section: ${sectionId}`);
      return NextResponse.json(
        { error: "No questions available for this section" },
        { status: 404 }
      );
    }

    const preprocessedMockQuestions = sectionQuestions.map((question) =>
      preprocessQuestion(question)
    );

    const shuffledMockQuestions = preprocessedMockQuestions.map((question) =>
      shuffleOptions(question)
    );

    const payload = {
      questions: pickRandomSubset(shuffledMockQuestions, questionCount),
      readingPassage,
    };
    const parsed = QuestionsResponseSchema.safeParse(payload);
    if (!parsed.success) {
      logger.error("Invalid mock questions response:", parsed.error);
      return NextResponse.json(
        { error: "Invalid response format" },
        { status: 500 }
      );
    }
    return NextResponse.json(parsed.data);
  } catch (error) {
    logger.error("Error in questions API:", error);

    // Fallback to mock questions in case of any error
    const fallbackQuestions = mockQuestions[sectionId as keyof typeof mockQuestions];
    if (fallbackQuestions && fallbackQuestions.length > 0) {
      const preprocessedMockQuestions = fallbackQuestions.map((question) =>
        preprocessQuestion(question)
      );

      const shuffledMockQuestions = preprocessedMockQuestions.map((question) =>
        shuffleOptions(question)
      );

      return NextResponse.json({
        questions: pickRandomSubset(shuffledMockQuestions, questionCount),
        readingPassage:
          sectionId === "reading" ? DEFAULT_READING_PASSAGE : null,
      });
    }

    return NextResponse.json(
      { error: "Failed to retrieve questions" },
      { status: 500 }
    );
  }
}
