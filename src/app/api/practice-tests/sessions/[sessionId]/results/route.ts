import { NextResponse } from "next/server";
import { verifySessionFromRequest } from "@/lib/server-auth";
import { getResultsBySession, getSession } from "@/lib/server-practice-tests";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const session = await verifySessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const fullTestSession = await getSession(sessionId);
    if (!fullTestSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (fullTestSession.userId !== session.uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const results = await getResultsBySession(sessionId);
    if (!results) {
      return NextResponse.json({ error: "Results not ready" }, { status: 404 });
    }

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load results" },
      { status: 500 }
    );
  }
}
