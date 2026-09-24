import { NextResponse } from "next/server";
import { errorResponse } from "@/utils/apiValidation";
import { z } from "zod";
import { verifySessionFromRequest } from "@/lib/server-auth";
import {
  assertSection,
  getOwnedSession,
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
    return errorResponse("Unauthorized", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = SubmitSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid submission payload", 400);
  }

  try {
    const owned = await getOwnedSession(sessionId, session.uid);
    if (owned.error) return owned.error;
    const fullTestSession = owned.session;

    if (!assertSection(fullTestSession.sections, sectionId)) {
      return errorResponse("Section not found", 404);
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
