import { getAdminAuthOptional } from "@/config/firebase-admin";

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

export async function verifySessionFromRequest(request: Request) {
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
