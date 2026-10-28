import { NextResponse } from "next/server";
import { errorResponse } from "@/utils/apiValidation";
import { z } from "zod";
import { verifySessionFromRequest } from "@/lib/server-auth";
import { gradeSectionAnswers } from "@/lib/grade-section";
import {
  assertSection,
  getOwnedSession,
  getStoredSectionQuestions,
  upsertSectionAttempt,
} from "@/lib/server-practice-tests";
import { logger } from "@/utils/logger";

const SubmitSchema = z.object({
  sectionId: z.string().min(1).max(40),
  answers: z
    .record(z.string().max(200), z.string().max(2000))
    .refine((answers) => Object.keys(answers).length <= 200, "Too many answers"),
  timeSpentSeconds: z.number().min(0).max(86400),
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

    const stored = await getStoredSectionQuestions(sessionId, sectionId);
    if (!stored) {
      return errorResponse("Reload this section before submitting.", 409);
    }

    const graded = gradeSectionAnswers(stored.questions, parsed.data.answers);
    await upsertSectionAttempt(sessionId, {
      sectionId,
      answers: parsed.data.answers,
      score: graded.score,
      totalQuestions: graded.totalQuestions,
      timeSpentSeconds: parsed.data.timeSpentSeconds,
      questionsData: stored.questions,
    });

    return NextResponse.json({ ok: true, score: graded.score, totalQuestions: graded.totalQuestions });
  } catch (error) {
    logger.error("Failed to save section", error);
    return errorResponse("Failed to save section", 500);
  }
}
