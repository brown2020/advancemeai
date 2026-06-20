export const SESSION_REQUEST_HEADER = "x-advanceme-session";
export const SESSION_REQUEST_HEADER_VALUE = "1";

export type SessionRequestValidationResult =
  | { ok: true }
  | { ok: false; error: string };

function originOf(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function hasSessionRequestHeader(headers: Headers): boolean {
  return headers.get(SESSION_REQUEST_HEADER) === SESSION_REQUEST_HEADER_VALUE;
}

export function isSameOriginSessionRequest(
  headers: Headers,
  requestUrl: string,
  nodeEnv = process.env.NODE_ENV
): boolean {
  const requestOrigin = originOf(requestUrl);
  if (!requestOrigin) return false;

  const origin = headers.get("origin");
  if (origin) {
    return originOf(origin) === requestOrigin;
  }

  const referer = headers.get("referer");
  if (referer) {
    return originOf(referer) === requestOrigin;
  }

  return nodeEnv !== "production";
}

export function validateSessionMutationRequest(
  headers: Headers,
  requestUrl: string,
  nodeEnv = process.env.NODE_ENV
): SessionRequestValidationResult {
  if (!hasSessionRequestHeader(headers)) {
    return {
      ok: false,
      error: "Invalid session request. Please refresh and try again.",
    };
  }

  if (!isSameOriginSessionRequest(headers, requestUrl, nodeEnv)) {
    return {
      ok: false,
      error: "Invalid session origin. Please refresh and try again.",
    };
  }

  return { ok: true };
}
