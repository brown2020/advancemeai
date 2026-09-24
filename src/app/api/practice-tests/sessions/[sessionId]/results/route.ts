import { NextResponse } from "next/server";
import { errorResponse } from "@/utils/apiValidation";
import { verifySessionFromRequest } from "@/lib/server-auth";
import { getResultsBySession, getOwnedSession } from "@/lib/server-practice-tests";

export async function GET(
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

    const results = await getResultsBySession(sessionId);
    if (!results) {
      return errorResponse("Results not ready", 404);
    }

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load results" },
      { status: 500 }
    );
  }
}
