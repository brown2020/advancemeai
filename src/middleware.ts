import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Get the auth cookie
  const session = request.cookies.get("session");

  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === "development";

  // Check if this is a test request
  const isTestRequest = request.nextUrl.searchParams.get("test") === "true";

  console.log("Middleware checking path:", request.nextUrl.pathname);
  console.log("Auth status:", {
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
    console.log("Middleware: Allowing access to debug page");
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
    console.log(
      "Middleware: Redirecting unauthenticated user from",
      request.nextUrl.pathname
    );
    // Redirect to the home page
    return NextResponse.redirect(new URL("/", request.url));
  }

  console.log("Middleware: Allowing access to", request.nextUrl.pathname);
  return NextResponse.next();
}

export const config = {
  matcher: "/practice/:path*",
};
