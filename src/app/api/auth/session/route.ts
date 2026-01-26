import { NextResponse } from "next/server";
import { getAdminAuthOptional } from "@/config/firebase-admin";
import { logger } from "@/utils/logger";

const COOKIE_NAME = "session";
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

/**
 * Creates a session cookie from a Firebase ID token
 * @param request - HTTP request containing idToken in body
 * @returns JSON response with status
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      logger.warn("Session creation failed: Missing idToken");
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    const expiresIn = MAX_AGE_MS;
    const adminAuth = getAdminAuthOptional();
    if (!adminAuth) {
      logger.error("Session creation failed: Firebase Admin not initialized");
      return NextResponse.json(
        { error: "Server missing credentials" },
        { status: 500 }
      );
    }
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    // In dev on http://localhost, Secure cookies are ignored by the browser.
    // In prod (or behind https), we always set Secure.
    const forwardedProto = request.headers.get("x-forwarded-proto");
    const isHttps = forwardedProto === "https";
    const isProduction = process.env.NODE_ENV === "production";
    const secureAttr = isProduction || isHttps ? " Secure;" : "";

    const res = NextResponse.json({ status: "ok" });
    res.headers.append(
      "Set-Cookie",
      `${COOKIE_NAME}=${sessionCookie}; Path=/; HttpOnly;${secureAttr} SameSite=Strict; Max-Age=${Math.floor(
        expiresIn / 1000
      )}`
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

/**
 * Deletes the session cookie to sign out the user
 * @returns JSON response confirming sign out
 */
export async function DELETE(): Promise<NextResponse> {
  const isProduction = process.env.NODE_ENV === "production";
  const secureAttr = isProduction ? " Secure;" : "";
  const res = NextResponse.json({ status: "signed_out" });
  res.headers.append(
    "Set-Cookie",
    `${COOKIE_NAME}=; Path=/; HttpOnly;${secureAttr} SameSite=Strict; Max-Age=0`
  );
  
  logger.info("Session deleted successfully");
  return res;
}
