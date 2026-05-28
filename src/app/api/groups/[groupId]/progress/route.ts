import { NextResponse } from "next/server";
import { verifySessionFromRequest } from "@/lib/server-auth";
import { loadClassProgressForGroup } from "@/lib/server-class-progress";
import { errorResponse } from "@/utils/apiValidation";

type RouteParams = { params: Promise<{ groupId: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  const session = await verifySessionFromRequest(request);
  if (!session) {
    return errorResponse("Unauthorized", 401);
  }

  const { groupId } = await params;
  if (!groupId) {
    return errorResponse("Missing group id", 400);
  }

  const progress = await loadClassProgressForGroup(groupId, session.uid);
  if (!progress) {
    return errorResponse("Forbidden or group not found", 403);
  }

  return NextResponse.json(progress);
}
