import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const requestSchema = z.object({
  message: z.string().min(1).max(1000),
  context: z
    .object({
      setTitle: z.string().optional(),
      setDescription: z.string().optional(),
      currentTerm: z.string().optional(),
      currentDefinition: z.string().optional(),
      subject: z.string().optional(),
    })
    .optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .max(10)
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { message, context, history } = parsed.data;

    // Build context for the system prompt
    let contextInfo = "";
    if (context) {
      if (context.setTitle) {
        contextInfo += `The student is studying a flashcard set titled "${context.setTitle}". `;
      }
      if (context.setDescription) {
        contextInfo += `Set description: ${context.setDescription}. `;
      }
      if (context.currentTerm && context.currentDefinition) {
        contextInfo += `Currently viewing: Term "${context.currentTerm}" with definition "${context.currentDefinition}". `;
      }
      if (context.subject) {
        contextInfo += `Subject area: ${context.subject}. `;
      }
    }

    const systemPrompt = `You are a friendly and knowledgeable AI study tutor. Your role is to help students understand concepts, explain difficult topics, and provide encouragement.

${
  contextInfo
    ? `Context about what the student is studying:\n${contextInfo}\n`
    : ""
}

Guidelines:
- Be encouraging and supportive
- Explain concepts clearly and simply
- Use examples and analogies when helpful
- If you're not sure about something, say so
- Keep responses concise but thorough (usually 2-4 sentences)
- For factual questions about specific topics, be accurate
- If the student seems confused, try a different explanation approach
- Encourage the student to think through problems

IMPORTANT: You should politely decline to:
- Write essays, homework, or complete assignments for the student
- Provide information unrelated to studying or learning
- Engage in inappropriate conversations`;

    // Build messages array
    const messages: {
      role: "system" | "user" | "assistant";
      content: string;
    }[] = [{ role: "system", content: systemPrompt }];

    // Add conversation history
    if (history) {
      for (const msg of history) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Add current message
    messages.push({ role: "user", content: message });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("No response from AI");
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Chat error:", error);

    return NextResponse.json(
      { error: "Failed to process your request" },
      { status: 500 }
    );
  }
}
