import type { DecodedIdToken } from "firebase-admin/auth";
import { NextResponse } from "next/server";
import { verifySessionFromRequest } from "@/lib/server-auth";
import { consumeRateLimit } from "@/lib/rate-limit";
import { sessionEligibilityForToken } from "@/lib/session-eligibility";
import { errorResponse } from "@/utils/apiValidation";

const AI_LIMIT = 20;
const AI_WINDOW_MS = 10 * 60 * 1000;

export function hasVerifiedAiAccess(token: DecodedIdToken): boolean {
  return sessionEligibilityForToken(token).ok;
}

/**
 * Auth + email verification + per-user rate limit for routes that call OpenAI.
 */
export async function requireAiUser(
  request: Request
): Promise<{ ok: true; uid: string } | { ok: false; response: NextResponse }> {
  const session = await verifySessionFromRequest(request);
  if (!session) {
    return { ok: false, response: errorResponse("Unauthorized", 401) };
  }

  if (!hasVerifiedAiAccess(session)) {
    return {
      ok: false,
      response: errorResponse("Verify your email to use AI features.", 403),
    };
  }

  const limit = consumeRateLimit(`ai:${session.uid}`, AI_LIMIT, AI_WINDOW_MS);
  if (!limit.ok) {
    const response = errorResponse(
      "Too many AI requests. Please wait and try again.",
      429
    );
    response.headers.set("Retry-After", String(limit.retryAfterSeconds));
    return { ok: false, response };
  }

  return { ok: true, uid: session.uid };
}
