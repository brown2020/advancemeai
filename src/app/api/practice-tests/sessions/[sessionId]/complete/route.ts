import { NextResponse } from "next/server";
import { errorResponse } from "@/utils/apiValidation";
import { verifySessionFromRequest } from "@/lib/server-auth";
import {
  getSectionAttempts,
  getOwnedSession,
  saveResults,
} from "@/lib/server-practice-tests";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const session = await verifySessionFromRequest(request);
  if (!session) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    const owned = await getOwnedSession(sessionId, session.uid);
    if (owned.error) return owned.error;

    const attempts = await getSectionAttempts(sessionId);
    if (!attempts.length) {
      return errorResponse("No section attempts found", 400);
    }

    const totalScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
    const totalQuestions = attempts.reduce(
      (sum, attempt) => sum + attempt.totalQuestions,
      0
    );
    const totalTimeSeconds = attempts.reduce(
      (sum, attempt) => sum + attempt.timeSpentSeconds,
      0
    );

    const strengths = attempts
      .filter((attempt) =>
        attempt.totalQuestions > 0
          ? attempt.score / attempt.totalQuestions >= 0.8
          : false
      )
      .map((attempt) => attempt.sectionId);
    const weaknesses = attempts
      .filter((attempt) =>
        attempt.totalQuestions > 0
          ? attempt.score / attempt.totalQuestions <= 0.6
          : false
      )
      .map((attempt) => attempt.sectionId);

    const results = await saveResults(sessionId, {
      userId: session.uid,
      status: "completed",
      sections: attempts,
      totalScore,
      totalQuestions,
      totalTimeSeconds,
      completedAt: Date.now(),
      strengths,
      weaknesses,
    });

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to complete" },
      { status: 500 }
    );
  }
}
