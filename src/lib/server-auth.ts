import { getAdminAuthOptional } from "@/config/firebase-admin";
import type { DecodedIdToken } from "firebase-admin/auth";

/**
 * Extracts a cookie value from the Cookie header
 * @param cookieHeader - Raw cookie header string
 * @param name - Name of the cookie to extract
 * @returns Cookie value or null if not found
 */
function getCookieValue(
  cookieHeader: string | null,
  name: string
): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(/;\s*/);
  for (const part of parts) {
    const [k, ...rest] = part.split("=");
    if (k === name) return rest.join("=");
  }
  return null;
}

/**
 * Verifies the session cookie from an incoming request
 * @param request - Incoming HTTP request
 * @returns Decoded session token or null if verification fails
 */
export async function verifySessionFromRequest(
  request: Request
): Promise<DecodedIdToken | null> {
  try {
    const cookieHeader = request.headers.get("cookie");
    const session = getCookieValue(cookieHeader, "session");
    if (!session) return null;
    const adminAuth = getAdminAuthOptional();
    if (!adminAuth) return null;
    const decoded = await adminAuth.verifySessionCookie(session, true);
    return decoded;
  } catch {
    return null;
  }
}
