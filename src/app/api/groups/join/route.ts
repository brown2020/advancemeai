import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifySessionFromRequest } from "@/lib/server-auth";
import { joinGroupByCode } from "@/lib/server-groups";
import { errorResponse } from "@/utils/apiValidation";
import { logger } from "@/utils/logger";

const bodySchema = z.object({
  code: z.string().trim().min(4).max(12),
});

export async function POST(request: NextRequest) {
  const session = await verifySessionFromRequest(request);
  if (!session) return errorResponse("Unauthorized", 401);

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid class code", 400);

  try {
    const result = await joinGroupByCode(parsed.data.code.toUpperCase(), session.uid);
    if (!result) return errorResponse("Class not found", 404);
    return NextResponse.json({
      id: result.group.id,
      alreadyMember: result.alreadyMember,
    });
  } catch (error) {
    logger.error("Group join failed", error);
    return errorResponse("Failed to join that class", 500);
  }
}
