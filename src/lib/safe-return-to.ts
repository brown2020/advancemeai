/**
 * Sanitizes a return-to URL to prevent open redirect attacks.
 * Safe for client and server imports.
 *
 * Only a single-slash relative path is allowed. Backslashes are rejected
 * because URL parsers treat `/\host` like `//host` (protocol-relative).
 */
export function safeReturnTo(
  returnTo: string | string[] | undefined,
  fallback = "/"
): string {
  const raw = Array.isArray(returnTo) ? returnTo[0] : returnTo;
  if (!raw || !isSafeInternalPath(raw)) return fallback;
  return raw;
}

function isSafeInternalPath(value: string): boolean {
  if (!value.startsWith("/")) return false;
  if (value.startsWith("//") || value.startsWith("/\\")) return false;
  if (value.includes("\\")) return false;
  if (value.includes("://")) return false;
  if (hasControlChar(value)) return false;
  if (hasEncodedSlash(value)) return false;

  try {
    const decoded = decodeURIComponent(value);
    if (decoded !== value) {
      if (!decoded.startsWith("/") || decoded.startsWith("//")) return false;
      if (decoded.includes("\\") || decoded.includes("://")) return false;
      if (hasControlChar(decoded) || hasEncodedSlash(decoded)) return false;
    }
  } catch {
    return false;
  }

  return true;
}

function hasControlChar(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code <= 31 || code === 127) return true;
  }
  return false;
}

function hasEncodedSlash(value: string): boolean {
  return /%(?:2f|5c)/i.test(value);
}
