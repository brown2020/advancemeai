import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Get the auth cookie
  const session = request.cookies.get("session");

  // If the user is not logged in and trying to access /practice
  if (!session && request.nextUrl.pathname.startsWith("/practice")) {
    // Redirect to the home page
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/practice/:path*",
};
