/**
 * Sanitizes a return-to URL to prevent open redirect attacks.
 * Safe for client and server imports.
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
