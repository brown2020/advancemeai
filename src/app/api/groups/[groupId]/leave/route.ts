import { NextResponse } from "next/server";
import { verifySessionFromRequest } from "@/lib/server-auth";
import { leaveGroup } from "@/lib/server-groups";
import { errorResponse } from "@/utils/apiValidation";
import { logger } from "@/utils/logger";

type RouteParams = { params: Promise<{ groupId: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const session = await verifySessionFromRequest(request);
  if (!session) return errorResponse("Unauthorized", 401);

  const { groupId } = await params;
  if (!groupId || groupId.length > 128) return errorResponse("Missing group id", 400);

  try {
    const result = await leaveGroup(groupId, session.uid);
    if (result === "missing") return errorResponse("Class not found", 404);
    if (result === "owner") {
      return errorResponse("The owner cannot leave the class. Delete it instead.", 400);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error("Group leave failed", error);
    return errorResponse("Failed to leave that class", 500);
  }
}
