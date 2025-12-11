import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Protected routes that require authentication
 */
const PROTECTED_ROUTES = [
  "/practice",
  "/flashcards",
  "/quizzes",
  "/profile",
  "/test",
];

/**
 * Public routes that don't require authentication
 */
const PUBLIC_PREFIXES = ["/", "/auth/", "/api/", "/_next/", "/favicon.ico"];

/**
 * Next.js 16 proxy function for route protection
 * In Next.js 16, proxy.ts replaces middleware.ts
 */
export default function proxy(request: NextRequest) {
  const session = request.cookies.get("session");
  const { pathname } = request.nextUrl;

  // Check if we're in development mode with test flag
  const isDevelopment = process.env.NODE_ENV === "development";
  const isTestRequest = request.nextUrl.searchParams.get("test") === "true";
  const forceAccess = isDevelopment && isTestRequest;

  // Allow debug routes in development
  if (
    isDevelopment &&
    (pathname === "/practice/debug" || pathname === "/debug")
  ) {
    return NextResponse.next();
  }

  // Allow public routes
  const isPublicRoute =
    pathname === "/" ||
    PUBLIC_PREFIXES.some(
      (prefix) => prefix !== "/" && pathname.startsWith(prefix)
    );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check protected routes
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Redirect to sign-in if accessing protected route without session
  if (isProtectedRoute && !session && !forceAccess) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
