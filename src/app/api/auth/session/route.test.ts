import { NextResponse } from "next/server";
import {
  SESSION_REQUEST_HEADER,
  SESSION_REQUEST_HEADER_VALUE,
} from "@/lib/session-request";

jest.mock("@/config/firebase-admin", () => ({
  getAdminAuthOptional: () => null,
}));

import { DELETE, POST } from "./route";

const SESSION_URL = "http://localhost:3000/api/auth/session";

function sessionRequest(
  method: string,
  body?: string,
  headers: Record<string, string> = {}
): Request {
  return new Request(SESSION_URL, {
    method,
    headers: {
      origin: "http://localhost:3000",
      [SESSION_REQUEST_HEADER]: SESSION_REQUEST_HEADER_VALUE,
      ...headers,
    },
    body,
  });
}

describe("auth session route", () => {
  it("blocks session creation that is missing the app header", async () => {
    const response = await POST(
      new Request(SESSION_URL, {
        method: "POST",
        body: JSON.stringify({ idToken: "token" }),
      })
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid session request. Please refresh and try again.",
    });
  });

  it("rejects a sign-in body without an id token", async () => {
    const response = await POST(
      sessionRequest("POST", JSON.stringify({ idToken: "  " }), {
        "content-type": "application/json",
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Missing sign-in token. Please try again.",
    });
  });

  it("reports auth as unavailable when Admin is not configured", async () => {
    const response = await POST(
      sessionRequest("POST", JSON.stringify({ idToken: "student-token" }), {
        "content-type": "application/json",
      })
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Authentication is temporarily unavailable. Please try again later.",
    });
  });

  it("clears the session cookie on sign-out", async () => {
    const response = await DELETE(sessionRequest("DELETE"));

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "signed_out" });

    const cookie = response.headers.get("set-cookie") ?? "";
    expect(cookie).toContain("session=");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Max-Age=0");
  });
});
