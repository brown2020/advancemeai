import { NextResponse } from "next/server";
import { getAdminAuthOptional } from "@/config/firebase-admin";
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

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      logger.warn("Session creation failed: Missing idToken");
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    const adminAuth = getAdminAuthOptional();
    if (!adminAuth) {
      logger.error("Session creation failed: Firebase Admin not initialized");
      return NextResponse.json(
        { error: "Server missing credentials" },
        { status: 500 }
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
      { error: "Failed to create session" },
      { status: 401 }
    );
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const secure = isSecureContext(request);
  const res = NextResponse.json({ status: "signed_out" });
  res.headers.append("Set-Cookie", buildCookieHeader("", 0, secure));

  logger.info("Session deleted successfully");
  return res;
}
