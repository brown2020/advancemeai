import { NextResponse } from "next/server";
import { verifySessionFromRequest } from "@/lib/server-auth";
import { assertSection, getSession } from "@/lib/server-practice-tests";
import { DIGITAL_SAT_SECTIONS } from "@/constants/sat";
import {
  getOpenAIClient,
  buildQuestionPrompt,
  SYSTEM_PROMPT,
  validateQuestion,
  cleanAIGeneratedQuestion,
  preprocessQuestion,
  shuffleOptions,
  generateReadingPassage,
  DEFAULT_READING_PASSAGE,
  type Difficulty,
  type Question,
} from "@/lib/ai/question-generation";
import { QuestionsResponseSchema } from "@/types/question";
import { MOCK_QUESTIONS } from "@/constants/mockQuestions";

const MAX_AI_QUESTIONS = 8;

async function generateAIQuestions(
  sectionId: string,
  count: number
): Promise<Question[]> {
  if (!process.env.OPENAI_API_KEY) return [];
  const openai = getOpenAIClient();
  const questions: Question[] = [];

  for (let i = 0; i < count; i += 1) {
    const difficulty = (Math.floor(Math.random() * 5) + 1) as Difficulty;
    const prompt = buildQuestionPrompt(sectionId, difficulty);

    try {
      const completion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        model: "gpt-4.1",
        temperature: 0.7,
      });

      const content = completion.choices[0].message.content;
      if (!content) continue;

      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleanContent);
      const validated = validateQuestion(parsed, sectionId);
      const cleaned = cleanAIGeneratedQuestion({
        ...validated,
        id: `ai-${sectionId}-${Date.now()}-${i}`,
        difficulty,
      });
      questions.push(cleaned);
    } catch {
      continue;
    }
  }

  return questions;
}

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
  while (expanded.length < count) {
    const source = base[index % base.length];
    expanded.push({
      ...source,
      id: `${source.id}-${sectionId}-${expanded.length}`,
    });
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
  const isLocalMode = url.searchParams.get("local") === "true";
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

    if (!assertSection(sections as any, sectionId)) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    const offsetParam = url.searchParams.get("offset");
    const limitParam = url.searchParams.get("limit");
    const offset = offsetParam ? Math.max(0, Number(offsetParam)) : 0;
    const limit = limitParam ? Math.max(1, Number(limitParam)) : undefined;

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
    const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);

    if (sectionId === "reading-writing") {
      const readingCount = Math.ceil(requestedCount / 2);
      const writingCount = Math.max(requestedCount - readingCount, 0);

      readingPassage =
        offset === 0
          ? hasOpenAI
            ? await generateReadingPassage()
            : DEFAULT_READING_PASSAGE
          : null;
      const readingGenerated = await generateAIQuestions(
        "reading",
        Math.min(readingCount, MAX_AI_QUESTIONS)
      );
      const writingGenerated = await generateAIQuestions(
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
      const generated = await generateAIQuestions(
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

    const preprocessed = questions.map((question) =>
      shuffleOptions(preprocessQuestion(question))
    );
    const payload = { questions: preprocessed, readingPassage };

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
