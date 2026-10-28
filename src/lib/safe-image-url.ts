const STORAGE_HOSTS = new Set([
  "firebasestorage.googleapis.com",
  "storage.googleapis.com",
]);

/**
 * Flashcard images may only be Firebase Storage download URLs.
 * Anything else is dropped so a public set cannot point an <img> at an arbitrary host.
 */
export function safeFlashcardImageUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 2048) return undefined;
  if (trimmed.includes("\\")) return undefined;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return undefined;
  }

  if (url.username || url.password) return undefined;

  const host = url.hostname.toLowerCase();
  if (url.protocol === "https:" && STORAGE_HOSTS.has(host)) {
    return url.toString();
  }

  const isEmulatorHost = host === "127.0.0.1" || host === "localhost";
  if (
    process.env.NODE_ENV !== "production" &&
    url.protocol === "http:" &&
    isEmulatorHost &&
    url.port === "9199"
  ) {
    return url.toString();
  }

  return undefined;
}
