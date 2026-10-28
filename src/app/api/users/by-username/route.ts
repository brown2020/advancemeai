import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminDbOptional } from "@/config/firebase-admin";
import { toPublicProfile } from "@/lib/public-profile";
import { errorResponse } from "@/utils/apiValidation";
import { logger } from "@/utils/logger";

const querySchema = z.object({
  username: z.string().trim().min(1).max(40),
});

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse({
    username: request.nextUrl.searchParams.get("username"),
  });
  if (!parsed.success) return errorResponse("Invalid username", 400);

  const db = getAdminDbOptional();
  if (!db) return errorResponse("Database not available", 503);

  try {
    const snap = await db
      .collection("userProfiles")
      .where("username", "==", parsed.data.username.toLowerCase())
      .limit(1)
      .get();
    const doc = snap.docs[0];
    if (!doc) return errorResponse("User not found", 404);
    return NextResponse.json(toPublicProfile(doc.id, doc.data() as Record<string, unknown>));
  } catch (error) {
    logger.error("Public profile lookup failed", error);
    return errorResponse("Failed to load profile", 500);
  }
}
