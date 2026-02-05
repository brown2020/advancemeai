import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { verifySessionFromRequest } from "@/lib/server-auth";
import { logger } from "@/utils/logger";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const requestSchema = z.object({
  content: z.string().min(100, "Content must be at least 100 characters"),
  title: z.string().optional(),
  contentType: z
    .enum(["text", "notes", "transcript", "article"])
    .default("text"),
  subject: z.string().optional(),
  generateFlashcards: z.boolean().default(true),
  generateQuestions: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid request" },
        { status: 400 }
      );
    }

    const {
      content,
      title,
      contentType,
      subject,
      generateFlashcards,
      generateQuestions,
    } = parsed.data;

    const systemPrompt = `You are an expert educational content analyzer and study guide creator. 
Your task is to transform raw content into a well-organized, comprehensive study guide.
${subject ? `The subject area is: ${subject}` : ""}
The content type is: ${contentType}

Create a study guide with:
1. A clear, descriptive title (if not provided)
2. A concise summary (2-3 paragraphs)
3. 3-5 organized sections with key points
${generateFlashcards ? "4. 5-10 flashcard-style term/definition pairs" : ""}
${generateQuestions ? "5. 5-10 practice questions with answers" : ""}

Respond in JSON format with this structure:
{
  "title": "string",
  "summary": "string",
  "sections": [
    {
      "title": "string",
      "content": "string",
      "keyPoints": ["string"]
    }
  ],
  "flashcards": [
    { "term": "string", "definition": "string" }
  ],
  "questions": [
    {
      "question": "string",
      "answer": "string",
      "type": "short_answer" | "multiple_choice",
      "options": ["string"] (for multiple choice only),
      "correctOptionIndex": number (for multiple choice only)
    }
  ]
}`;

    const userPrompt = `${
      title ? `Title: ${title}\n\n` : ""
    }Content to analyze:\n\n${content}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error("No response from AI");
    }

    let studyGuide: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(responseText);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Expected JSON object");
      }
      studyGuide = parsed as Record<string, unknown>;
    } catch (parseError) {
      logger.error("Failed to parse AI study guide response:", parseError);
      return NextResponse.json(
        { error: "AI returned an invalid response format. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      studyGuide: {
        ...studyGuide,
        status: "completed",
        createdAt: Date.now(),
      },
    });
  } catch (error) {
    logger.error("Study guide generation error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate study guide. Please try again." },
      { status: 500 }
    );
  }
}
