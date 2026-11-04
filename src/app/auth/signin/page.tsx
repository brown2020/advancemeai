import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthPageFallback } from "@/components/auth/AuthPageFallback";
import SignInClient from "./SignInClient";

export const metadata: Metadata = {
  title: "Sign in | AdvanceMe AI",
  description: "Sign in to Advance.me to study flashcards and prep for the SAT.",
};

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  return (
    <Suspense fallback={<AuthPageFallback message="Loading sign in…" />}>
      <SignInClient returnToParam={first(sp.returnTo)} />
    </Suspense>
  );
}
