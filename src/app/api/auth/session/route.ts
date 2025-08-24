import { NextResponse } from "next/server";
import { getAdminAuthOptional } from "@/config/firebase-admin";

const COOKIE_NAME = "session";
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    const expiresIn = MAX_AGE_MS;
    const adminAuth = getAdminAuthOptional();
    if (!adminAuth) {
      return NextResponse.json(
        { error: "Server missing credentials" },
        { status: 500 }
      );
    }
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    const res = NextResponse.json({ status: "ok" });
    res.headers.append(
      "Set-Cookie",
      `${COOKIE_NAME}=${sessionCookie}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${Math.floor(
        expiresIn / 1000
      )}`
    );
    return res;
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 401 }
    );
  }
}

export async function DELETE() {
  const res = NextResponse.json({ status: "signed_out" });
  res.headers.append(
    "Set-Cookie",
    `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
  );
  return res;
}
