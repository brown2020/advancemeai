import type { NextRequest } from "next/server";

export const SESSION_COOKIE_NAME = "session";

/** Routes that must not be reachable in production */
const DEVELOPMENT_ONLY_PATHS = new Set(["/debug", "/practice/debug"]);

const DEVELOPMENT_ONLY_PREFIXES = ["/test/"] as const;

/** Page routes that require a session cookie (presence check; verified in RSC/API) */
const PROTECTED_PAGE_PREFIXES = [
  "/flashcards/create",
  "/progress",
  "/profile",
  "/groups",
  "/quizzes/new",
  "/study-guides/create",
  "/live/host",
  "/practice/full-test",
] as const;

const AUTH_PAGE_PREFIXES = ["/auth/signin", "/auth/signup"] as const;

/**
 * API prefixes that require a session cookie at the edge.
 * Route handlers still verify the cookie with Firebase Admin.
 */
const PROTECTED_API_PREFIXES = [
  "/api/ai/",
  "/api/practice-tests/",
  "/api/quizzes",
  "/api/flashcards/",
  "/api/groups/",
  "/api/getquiz",
] as const;

/** API routes that stay public (no session required at proxy) */
const PUBLIC_API_PATHS = new Set(["/api/search", "/api/auth/session"]);

export function getSessionCookieValue(request: NextRequest): string | null {
  const value = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return value && value.length > 0 ? value : null;
}

export function hasSessionCookie(request: NextRequest): boolean {
  return getSessionCookieValue(request) !== null;
}

export function isDevelopmentOnlyPath(pathname: string): boolean {
  if (DEVELOPMENT_ONLY_PATHS.has(pathname)) return true;
  return DEVELOPMENT_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function isAuthPage(pathname: string): boolean {
  return AUTH_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/**
 * Practice list page uses client SignInGate; section/full-test/results require session.
 */
export function isProtectedPage(pathname: string, searchParams: URLSearchParams): boolean {
  if (pathname === "/practice") {
    const testMode =
      searchParams.get("test") === "true" &&
      process.env.NEXT_PUBLIC_ALLOW_TEST_MODE === "true";
    return !testMode;
  }

  if (pathname.startsWith("/practice/results/")) return true;
  if (pathname.startsWith("/practice/full-test")) return true;

  if (/^\/practice\/[^/]+$/.test(pathname) && pathname !== "/practice/debug") {
    return true;
  }

  if (/^\/flashcards\/[^/]+\/edit$/.test(pathname)) return true;

  if (/^\/quizzes\/[^/]+$/.test(pathname) && pathname !== "/quizzes/new") {
    return true;
  }

  return PROTECTED_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function isProtectedApiPath(pathname: string, method: string): boolean {
  if (PUBLIC_API_PATHS.has(pathname)) return false;

  if (pathname === "/api/questions" && method === "POST") return true;

  if (pathname.startsWith("/api/questions/") && method === "GET") {
    return false;
  }

  return PROTECTED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Local full-test bypass (`?local=true`) is only allowed in development or explicit test mode.
 */
export function isLocalTestModeEnabled(searchParams: URLSearchParams): boolean {
  if (searchParams.get("local") !== "true") return false;
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_ALLOW_TEST_MODE === "true"
  );
}
