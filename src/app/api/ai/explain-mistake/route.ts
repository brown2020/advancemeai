import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { FAST_MODEL } from "@/lib/ai/openai";
import { NextRequest } from "next/server";
import { z } from "zod";
import { validateRequest, CommonSchemas, errorResponse } from "@/utils/apiValidation";
import { requireAiUser } from "@/lib/ai/access";
import { logger } from "@/utils/logger";

const ExplainMistakeSchema = z.object({
  question: z.string().min(1, "Question is required").max(4000),
  userAnswer: z.string().min(1, "User answer is required").max(2000),
  correctAnswer: z.string().min(1, "Correct answer is required").max(2000),
  sectionId: CommonSchemas.sectionId,
});

/**
 * Generates an AI-powered explanation of why a student's answer was incorrect
 * @param request - HTTP request with question and answer data
 * @returns Streaming text response with explanation
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const access = await requireAiUser(request);
    if (!access.ok) return access.response;

    const validation = await validateRequest(request, ExplainMistakeSchema);
    if (!validation.success) return validation.error;

    const { question, userAnswer, correctAnswer, sectionId } = validation.data;

    const prompt = `
You are a supportive SAT tutor.
Question: ${question}
Student answer: ${userAnswer}
Correct answer: ${correctAnswer}
Section: ${sectionId}

Explain why the student's answer is incorrect, highlight the misconception, and provide a follow-up tip.
Limit to three short paragraphs and a final actionable bullet list.
`;

    const streamResult = await streamText({
      model: openai(FAST_MODEL),
      prompt,
    });

    return streamResult.toTextStreamResponse();
  } catch (error) {
    logger.error("Failed to generate explanation:", error);
    return errorResponse("Failed to generate explanation", 500);
  }
}
