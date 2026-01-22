import { NextResponse } from "next/server";
import { verifySessionFromRequest } from "@/lib/server-auth";
import { createSession } from "@/lib/server-practice-tests";
import { DIGITAL_SAT_SECTIONS } from "@/constants/sat";
import type { FullTestSectionConfig } from "@/types/practice-test";

export async function POST(request: Request) {
  const session = await verifySessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start test" },
      { status: 500 }
    );
  }
}
