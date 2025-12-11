import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { logger } from "@/utils/logger";

export async function proxy(request: NextRequest) {
  // Get the auth cookie
  const session = request.cookies.get("session");

  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === "development";

  // Check if this is a test request
  const isTestRequest = request.nextUrl.searchParams.get("test") === "true";

  logger.debug("Proxy checking path:", request.nextUrl.pathname);
  logger.debug("Auth status:", {
    session: session ? "Yes" : "No",
    isDevelopment,
    isTestRequest,
  });

  // Allow access to debug pages in development mode
  if (
    isDevelopment &&
    (request.nextUrl.pathname === "/practice/debug" ||
      request.nextUrl.pathname === "/debug")
  ) {
    logger.debug("Proxy: Allowing access to debug page");
    return NextResponse.next();
  }

  // Check for Development Mode or testing flag for direct access
  const forceAccess = isDevelopment || isTestRequest;

  // If the user is not logged in and trying to access /practice
  if (
    !forceAccess &&
    !session &&
    request.nextUrl.pathname.startsWith("/practice")
  ) {
    logger.info(
      "Proxy: Redirecting unauthenticated user from",
      request.nextUrl.pathname
    );
    // Redirect to the home page
    return NextResponse.redirect(new URL("/", request.url));
  }

  logger.debug("Proxy: Allowing access to", request.nextUrl.pathname);
  return NextResponse.next();
}

export const config = {
  matcher: "/practice/:path*",
};
