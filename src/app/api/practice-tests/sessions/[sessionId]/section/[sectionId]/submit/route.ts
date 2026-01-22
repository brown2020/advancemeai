import { NextResponse } from "next/server";
import { z } from "zod";
import { verifySessionFromRequest } from "@/lib/server-auth";
import {
  assertSection,
  getSession,
  upsertSectionAttempt,
} from "@/lib/server-practice-tests";

const SubmitSchema = z.object({
  sectionId: z.string().min(1),
  answers: z.record(z.string(), z.string()),
  score: z.number().min(0),
  totalQuestions: z.number().min(0),
  timeSpentSeconds: z.number().min(0),
  questionsData: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
        options: z.array(z.string()),
        correctAnswer: z.string(),
        explanation: z.string().optional(),
        sectionId: z.string().optional(),
      })
    )
    .optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string; sectionId: string }> }
) {
  const { sessionId, sectionId } = await params;
  const session = await verifySessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = SubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid submission payload" },
      { status: 400 }
    );
  }

  try {
    const fullTestSession = await getSession(sessionId);
    if (!fullTestSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (fullTestSession.userId !== session.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!assertSection(fullTestSession.sections, sectionId)) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    await upsertSectionAttempt(sessionId, {
      ...parsed.data,
      sectionId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to save section",
      },
      { status: 500 }
    );
  }
}
