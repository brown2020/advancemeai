import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifySessionFromRequest } from "@/lib/server-auth";
import { findGroupByInviteCode } from "@/lib/server-groups";
import { getAllMemberIds } from "@/types/study-group";
import { errorResponse } from "@/utils/apiValidation";
import { logger } from "@/utils/logger";

const querySchema = z.object({
  code: z.string().trim().min(4).max(12),
});

export async function GET(request: NextRequest) {
  const session = await verifySessionFromRequest(request);
  if (!session) return errorResponse("Unauthorized", 401);

  const parsed = querySchema.safeParse({
    code: request.nextUrl.searchParams.get("code"),
  });
  if (!parsed.success) return errorResponse("Invalid class code", 400);

  try {
    const group = await findGroupByInviteCode(parsed.data.code.toUpperCase());
    if (!group) return errorResponse("Class not found", 404);

    const uid = session.uid;
    return NextResponse.json({
      id: group.id,
      name: group.name,
      description: group.description,
      isClass: group.isClass === true,
      isPublic: group.isPublic,
      memberCount: getAllMemberIds(group).length,
      alreadyMember:
        group.ownerId === uid ||
        group.memberIds.includes(uid) ||
        group.adminIds.includes(uid),
    });
  } catch (error) {
    logger.error("Group lookup failed", error);
    return errorResponse("Failed to look up that class", 500);
  }
}
