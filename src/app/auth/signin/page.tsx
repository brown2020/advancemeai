import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import SignInClient from "./SignInClient";

export const metadata: Metadata = {
  title: "Auth · signin | AdvanceMe AI",
  description: "AdvanceMe AI — Auth · signin",
};

function SignInFallback() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-xl border border-border bg-card px-6 py-8 shadow-sm">
        <LoadingSpinner size="medium" />
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Loading sign in…
        </p>
      </div>
    </div>
  );
}

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
    <Suspense fallback={<SignInFallback />}>
      <SignInClient returnToParam={first(sp.returnTo)} />
    </Suspense>
  );
}
