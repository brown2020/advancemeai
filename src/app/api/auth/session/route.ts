import { NextResponse } from "next/server";
import { getAdminAuthOptional } from "@/config/firebase-admin";
import { validateSessionMutationRequest } from "@/lib/session-request";
import { logger } from "@/utils/logger";

const COOKIE_NAME = "session";
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

function isSecureContext(request: Request): boolean {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  return (
    process.env.NODE_ENV === "production" || forwardedProto === "https"
  );
}

function buildCookieHeader(
  value: string,
  maxAge: number,
  secure: boolean
): string {
  const secureAttr = secure ? " Secure;" : "";
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly;${secureAttr} SameSite=Lax; Max-Age=${maxAge}`;
}

function getIdToken(body: unknown): string | null {
  if (!body || typeof body !== "object" || !("idToken" in body)) {
    return null;
  }

  const idToken = (body as { idToken?: unknown }).idToken;
  return typeof idToken === "string" && idToken.trim().length > 0
    ? idToken
    : null;
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const protection = validateSessionMutationRequest(
      request.headers,
      request.url
    );
    if (!protection.ok) {
      logger.warn("Session creation blocked by request protection");
      return NextResponse.json(
        { error: protection.error },
        { status: 403 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      logger.warn("Session creation failed: Invalid JSON body", error);
      return NextResponse.json(
        { error: "Invalid sign-in request. Please try again." },
        { status: 400 }
      );
    }

    const idToken = getIdToken(body);
    if (!idToken) {
      logger.warn("Session creation failed: Missing idToken");
      return NextResponse.json(
        { error: "Missing sign-in token. Please try again." },
        { status: 400 }
      );
    }

    const adminAuth = getAdminAuthOptional();
    if (!adminAuth) {
      logger.error("Session creation failed: Firebase Admin not initialized");
      return NextResponse.json(
        {
          error:
            "Authentication is temporarily unavailable. Please try again later.",
        },
        { status: 503 }
      );
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: MAX_AGE_MS,
    });

    const secure = isSecureContext(request);
    const res = NextResponse.json({ status: "ok" });
    res.headers.append(
      "Set-Cookie",
      buildCookieHeader(sessionCookie, Math.floor(MAX_AGE_MS / 1000), secure)
    );

    logger.info("Session created successfully");
    return res;
  } catch (error) {
    logger.error("Failed to create session cookie:", error);
    return NextResponse.json(
      { error: "Your sign-in session expired. Please sign in again." },
      { status: 401 }
    );
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const protection = validateSessionMutationRequest(
    request.headers,
    request.url
  );
  if (!protection.ok) {
    logger.warn("Session deletion blocked by request protection");
    return NextResponse.json({ error: protection.error }, { status: 403 });
  }

  const secure = isSecureContext(request);
  const res = NextResponse.json({ status: "signed_out" });
  res.headers.append("Set-Cookie", buildCookieHeader("", 0, secure));

  logger.info("Session deleted successfully");
  return res;
}
