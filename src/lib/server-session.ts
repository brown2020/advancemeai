import type { DecodedIdToken } from "firebase-admin/auth";
import { cookies } from "next/headers";
import { getAdminAuthOptional } from "@/config/firebase-admin";

const COOKIE_NAME = "session";

export type ServerSession = {
  /**
   * Whether server-side session verification is available (i.e. firebase-admin
   * credentials are configured).
   */
  isAvailable: boolean;
  /**
   * Decoded Firebase session when present + valid, otherwise null.
   */
  user: DecodedIdToken | null;
};

export async function getServerSession(): Promise<ServerSession> {
  const adminAuth = getAdminAuthOptional();
  if (!adminAuth) return { isAvailable: false, user: null };

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME)?.value ?? null;
  if (!sessionCookie) return { isAvailable: true, user: null };

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return { isAvailable: true, user: decoded };
  } catch {
    return { isAvailable: true, user: null };
  }
}

/**
 * Sanitizes a return-to URL to prevent open redirect attacks
 * @param returnTo - URL to redirect to (from query param or form)
 * @param fallback - Fallback URL if returnTo is invalid
 * @returns Safe internal path or fallback
 */
export function safeReturnTo(
  returnTo: string | string[] | undefined,
  fallback = "/"
): string {
  const raw = Array.isArray(returnTo) ? returnTo[0] : returnTo;
  if (!raw) return fallback;

  // Only allow relative internal paths. Prevent open redirects like `//evil.com`.
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//")) return fallback;
  if (raw.includes("://")) return fallback;

  return raw;
}

