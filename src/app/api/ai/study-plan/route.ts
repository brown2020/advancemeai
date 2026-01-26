import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { validateRequest } from "@/utils/apiValidation";
import { logger } from "@/utils/logger";

const StudyPlanSchema = z.object({
  overall: z.object({
    score: z.number().min(0),
    totalQuestions: z.number().min(0),
    totalTimeSeconds: z.number().min(0),
  }),
  sections: z.array(
    z.object({
      sectionId: z.string().min(1),
      title: z.string().min(1),
      score: z.number().min(0),
      totalQuestions: z.number().min(0),
      timeSpentSeconds: z.number().min(0),
    })
  ),
  strengths: z.array(z.string()).optional(),
  weaknesses: z.array(z.string()).optional(),
});

/**
 * Generates a personalized study plan based on practice test results
 * @param request - HTTP request with test performance data
 * @returns Streaming text response with study plan
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    const validation = await validateRequest(request, StudyPlanSchema);
    if (!validation.success) return validation.error;

    const { overall, sections, strengths, weaknesses } = validation.data;

    const prompt = `
You are a supportive SAT tutor. Build a short, actionable study plan based on this Digital SAT practice test.

Overall:
- Score: ${overall.score}/${overall.totalQuestions}
- Time: ${Math.round(overall.totalTimeSeconds / 60)} minutes

Sections:
${sections
  .map(
    (section) =>
      `- ${section.title}: ${section.score}/${section.totalQuestions} in ${Math.round(
        section.timeSpentSeconds / 60
      )} minutes`
  )
  .join("\n")}

Strengths: ${(strengths ?? []).join(", ") || "N/A"}
Weaknesses: ${(weaknesses ?? []).join(", ") || "N/A"}

Requirements:
- 5-7 bullet points.
- Start with the highest priority weaknesses.
- Include time-boxed suggestions (e.g., "15 minutes/day").
- Finish with a short 1-2 sentence encouragement.
`;

    const streamResult = await streamText({
      model: openai("gpt-4.1-mini"),
      prompt,
    });

    return streamResult.toTextStreamResponse();
  } catch (error) {
    logger.error("Failed to generate study plan:", error);
    return NextResponse.json(
      { error: "Failed to generate study plan" },
      { status: 500 }
    );
  }
}
