import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { safeReturnTo } from "@/lib/safe-return-to";
import {
  hasSessionCookie,
  isAuthPage,
  isDevelopmentOnlyPath,
  isProtectedApiPath,
  isProtectedPage,
} from "@/lib/route-protection";

const SIGN_IN_PATH = "/auth/signin";

function signInRedirect(request: NextRequest, returnTo: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = SIGN_IN_PATH;
  url.search = `returnTo=${encodeURIComponent(returnTo)}`;
  return NextResponse.redirect(url);
}

function unauthorizedApiResponse(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/**
 * Next.js 16 proxy — edge routing, dev-only blocks, and session-cookie gates.
 *
 * Full session verification stays in server components (`getServerSession`)
 * and route handlers (`verifySessionFromRequest`). This layer only checks
 * cookie presence for speed.
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && isDevelopmentOnlyPath(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const sessionPresent = hasSessionCookie(request);

  if (pathname.startsWith("/api/")) {
    const method = request.method.toUpperCase();
    if (isProtectedApiPath(pathname, method) && !sessionPresent) {
      return unauthorizedApiResponse();
    }
    return NextResponse.next();
  }

  if (isAuthPage(pathname)) {
    if (sessionPresent) {
      const returnTo = safeReturnTo(
        request.nextUrl.searchParams.get("returnTo") ?? undefined,
        "/"
      );
      return NextResponse.redirect(new URL(returnTo, request.url));
    }
    return NextResponse.next();
  }

  if (
    isProtectedPage(pathname, request.nextUrl.searchParams) &&
    !sessionPresent
  ) {
    const returnTo = `${pathname}${request.nextUrl.search}`;
    return signInRedirect(request, returnTo);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|css|js|map)$).*)",
  ],
};
