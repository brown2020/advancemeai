import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthPageFallback } from "@/components/auth/AuthPageFallback";
import SignUpClient from "./SignUpClient";

export const metadata: Metadata = {
  title: "Sign up | AdvanceMe AI",
  description: "Create a free Advance.me account for flashcards and SAT prep.",
};

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  return (
    <Suspense fallback={<AuthPageFallback message="Loading sign up…" />}>
      <SignUpClient returnToParam={first(sp.returnTo)} />
    </Suspense>
  );
}
