import { NextResponse } from "next/server";
import { logger } from "@/utils/logger";
import {
  getOpenAIClient,
  WRITING_TEMPLATES,
  getSectionPrompt,
  validateQuestion,
  buildQuestionPrompt,
  SYSTEM_PROMPT,
  type Difficulty,
  type Question,
} from "@/lib/ai/question-generation";
import { MOCK_QUESTIONS } from "@/constants/mockQuestions";

// Use shared mock questions
const fallbackQuestions = MOCK_QUESTIONS;

export async function POST(request: Request) {
  try {
    const { section, difficulty, previousQuestions } = await request.json();

    try {
      const openai = getOpenAIClient();
      const sectionPrompt = getSectionPrompt(section);
      const templates =
        section.toLowerCase() === "writing"
          ? WRITING_TEMPLATES[difficulty as Difficulty]
          : [];

      const prompt = buildQuestionPrompt(section, difficulty as Difficulty);

      const completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        model: "gpt-4o",
        temperature: 0.7,
      });

      const content = completion.choices[0].message.content;
      if (!content) throw new Error("No content received from OpenAI");

      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();

      try {
        const question = JSON.parse(cleanContent);
        const validatedQuestion = validateQuestion(question, section);
        logger.debug("Successfully generated AI question:", validatedQuestion);
        return NextResponse.json(validatedQuestion);
      } catch (error) {
        logger.error("Failed to parse or validate AI response:", error);
        throw new Error("Invalid or inconsistent response from AI");
      }
    } catch (aiError) {
      logger.error("AI generation failed:", aiError);

      // Get section-specific questions
      const sectionQuestions = fallbackQuestions[section.toLowerCase()] || [];

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
