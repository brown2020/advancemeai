import { NextResponse } from "next/server";
import { z } from "zod";
import { verifySessionFromRequest } from "@/lib/server-auth";
import { isLocalTestModeEnabled } from "@/lib/route-protection";
import { assertSection, getSession } from "@/lib/server-practice-tests";
import { DIGITAL_SAT_SECTIONS } from "@/constants/sat";
import type { FullTestSectionConfig } from "@/types/practice-test";
import {
  generateQuestions,
  labelAndShuffle,
  generateReadingPassage,
  DEFAULT_READING_PASSAGE,
  type Question,
} from "@/lib/ai/question-generation";
import { hasOpenAIKey } from "@/lib/ai/openai";
import { QuestionsResponseSchema } from "@/types/question";
import { MOCK_QUESTIONS } from "@/constants/mockQuestions";

const MAX_AI_QUESTIONS = 8;

function fallbackQuestions(sectionId: string, count: number): Question[] {
  const pool = MOCK_QUESTIONS[sectionId as keyof typeof MOCK_QUESTIONS] ?? [];
  if (!pool.length) return [];

  const selected = pool.slice(0, Math.min(count, pool.length));
  return selected.map((question, index) => ({
    ...question,
    id: `mock-${sectionId}-${Date.now()}-${index}`,
  })) as Question[];
}

function expandQuestions(
  base: Question[],
  count: number,
  sectionId: string
): Question[] {
  if (count <= 0) return [];
  if (base.length === 0) return [];
  if (base.length >= count) return base.slice(0, count);

  const expanded: Question[] = [];
  let index = 0;
  while (expanded.length < count && base.length > 0) {
    const source = base[index % base.length];
    if (source) {
      expanded.push({
        ...source,
        id: `${source.id}-${sectionId}-${expanded.length}`,
      });
    }
    index += 1;
  }
  return expanded;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string; sectionId: string }> }
) {
  const { sessionId, sectionId } = await params;
  const url = new URL(request.url);
  const isLocalMode = isLocalTestModeEnabled(url.searchParams);
  const session = isLocalMode ? null : await verifySessionFromRequest(request);
  if (!isLocalMode && !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const fullTestSession = isLocalMode ? null : await getSession(sessionId);
    if (!isLocalMode && !fullTestSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (!isLocalMode && fullTestSession && session && fullTestSession.userId !== session.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sections = isLocalMode
      ? DIGITAL_SAT_SECTIONS
      : fullTestSession?.sections ?? [];

    if (!assertSection(sections as FullTestSectionConfig[], sectionId)) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    const paginationSchema = z.object({
      offset: z.coerce.number().int().min(0).default(0),
      limit: z.coerce.number().int().min(1).max(100).optional(),
    });
    const paginationResult = paginationSchema.safeParse({
      offset: url.searchParams.get("offset") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    });
    if (!paginationResult.success) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      );
    }
    const { offset, limit } = paginationResult.data;

    const sectionConfig = sections.find(
      (section) => section.id === sectionId
    );
    const questionCount = sectionConfig?.questionCount ?? 0;
    const remaining = Math.max(questionCount - offset, 0);
    const requestedCount =
      typeof limit === "number" ? Math.min(limit, remaining) : remaining;

    if (requestedCount <= 0) {
      return NextResponse.json({ questions: [], readingPassage: null });
    }

    let questions: Question[] = [];
    let readingPassage: string | null = null;
    const hasOpenAI = hasOpenAIKey();

    if (sectionId === "reading-writing") {
      const readingCount = Math.ceil(requestedCount / 2);
      const writingCount = Math.max(requestedCount - readingCount, 0);

      readingPassage =
        offset === 0
          ? hasOpenAI
            ? await generateReadingPassage()
            : DEFAULT_READING_PASSAGE
          : null;
      const readingGenerated = await generateQuestions(
        "reading",
        Math.min(readingCount, MAX_AI_QUESTIONS)
      );
      const writingGenerated = await generateQuestions(
        "writing",
        Math.min(writingCount, MAX_AI_QUESTIONS)
      );

      const readingSeed =
        readingGenerated.length > 0
          ? readingGenerated
          : fallbackQuestions("reading", Math.min(readingCount, MAX_AI_QUESTIONS));
      const writingSeed =
        writingGenerated.length > 0
          ? writingGenerated
          : fallbackQuestions("writing", Math.min(writingCount, MAX_AI_QUESTIONS));

      const readingQuestions = expandQuestions(
        readingSeed,
        readingCount,
        "reading"
      );
      const writingQuestions = expandQuestions(
        writingSeed,
        writingCount,
        "writing"
      );

      questions = [...readingQuestions, ...writingQuestions].map((question) => ({
        ...question,
        sectionId: "reading-writing",
      }));
    } else if (sectionId === "math") {
      const generated = await generateQuestions(
        "math-calc",
        Math.min(requestedCount, MAX_AI_QUESTIONS)
      );
      const seed =
        generated.length > 0
          ? generated
          : fallbackQuestions("math-calc", Math.min(requestedCount, MAX_AI_QUESTIONS));
      questions = expandQuestions(seed, requestedCount, "math-calc");
      questions = questions.map((question) => ({
        ...question,
        sectionId: "math",
      }));
    }

    if (sectionId === "reading-writing" && !readingPassage) {
      readingPassage = DEFAULT_READING_PASSAGE;
    }

    const payload = { questions: questions.map(labelAndShuffle), readingPassage };

    const parsed = QuestionsResponseSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid questions response" },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed.data);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate questions",
      },
      { status: 500 }
    );
  }
}
