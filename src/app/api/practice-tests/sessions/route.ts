import { NextResponse } from "next/server";
import { errorResponse } from "@/utils/apiValidation";
import { verifySessionFromRequest } from "@/lib/server-auth";
import { createSession } from "@/lib/server-practice-tests";
import { logger } from "@/utils/logger";
import { DIGITAL_SAT_SECTIONS } from "@/constants/sat";
import type { FullTestSectionConfig } from "@/types/practice-test";

export async function POST(request: Request) {
  const session = await verifySessionFromRequest(request);
  if (!session) {
    return errorResponse("Unauthorized", 401);
  }

  try {
    const sections: FullTestSectionConfig[] = DIGITAL_SAT_SECTIONS.map(
      (section) => ({
        id: section.id,
        title: section.title,
        description: section.description,
        questionCount: section.questionCount,
        timeLimitMinutes: section.timeLimitMinutes,
      })
    );

    const fullTestSession = await createSession(session.uid, sections);
    return NextResponse.json(fullTestSession);
  } catch (error) {
    logger.error("Failed to start test", error);
    return errorResponse("Failed to start test", 500);
  }
}
