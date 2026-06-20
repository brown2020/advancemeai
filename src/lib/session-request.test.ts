import {
  SESSION_REQUEST_HEADER,
  SESSION_REQUEST_HEADER_VALUE,
  hasSessionRequestHeader,
  isSameOriginSessionRequest,
  validateSessionMutationRequest,
} from "./session-request";

function headers(init: Record<string, string> = {}): Headers {
  return new Headers(init);
}

describe("session-request", () => {
  it("requires the app session mutation header", () => {
    expect(hasSessionRequestHeader(headers())).toBe(false);
    expect(
      hasSessionRequestHeader(
        headers({ [SESSION_REQUEST_HEADER]: SESSION_REQUEST_HEADER_VALUE })
      )
    ).toBe(true);
  });

  it("accepts same-origin session mutations", () => {
    const requestHeaders = headers({
      [SESSION_REQUEST_HEADER]: SESSION_REQUEST_HEADER_VALUE,
      origin: "https://advance.me",
    });

    expect(
      validateSessionMutationRequest(
        requestHeaders,
        "https://advance.me/api/auth/session",
        "production"
      )
    ).toEqual({ ok: true });
  });

  it("rejects cross-origin session mutations", () => {
    const requestHeaders = headers({
      [SESSION_REQUEST_HEADER]: SESSION_REQUEST_HEADER_VALUE,
      origin: "https://example.com",
    });

    expect(
      validateSessionMutationRequest(
        requestHeaders,
        "https://advance.me/api/auth/session",
        "production"
      )
    ).toEqual({
      ok: false,
      error: "Invalid session origin. Please refresh and try again.",
    });
  });

  it("rejects missing app headers before origin checks", () => {
    expect(
      validateSessionMutationRequest(
        headers({ origin: "https://advance.me" }),
        "https://advance.me/api/auth/session",
        "production"
      )
    ).toEqual({
      ok: false,
      error: "Invalid session request. Please refresh and try again.",
    });
  });

  it("allows missing origin metadata outside production", () => {
    expect(
      isSameOriginSessionRequest(
        headers({ [SESSION_REQUEST_HEADER]: SESSION_REQUEST_HEADER_VALUE }),
        "http://localhost:3000/api/auth/session",
        "development"
      )
    ).toBe(true);
  });

  it("rejects missing origin metadata in production", () => {
    expect(
      isSameOriginSessionRequest(
        headers({ [SESSION_REQUEST_HEADER]: SESSION_REQUEST_HEADER_VALUE }),
        "https://advance.me/api/auth/session",
        "production"
      )
    ).toBe(false);
  });
});
