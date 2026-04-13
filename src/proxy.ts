import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js 16 proxy — routing concerns only.
 *
 * Auth is handled by:
 *   - Server components: getServerSession() in page.tsx / layout.tsx
 *   - Client components: useAuth() context
 *
 * Do NOT add auth checks here. The proxy runs on every matched request
 * and should stay fast. See: https://nextjs.org/docs/app/building-your-application/upgrading/codemods#16-proxy-migration
 */
export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isDevelopment = process.env.NODE_ENV === "development";
  if (isDevelopment && (pathname === "/practice/debug" || pathname === "/debug")) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
