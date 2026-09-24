import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/ui/spinner";
import SignUpClient from "./SignUpClient";

export const metadata: Metadata = {
  title: "Sign up | AdvanceMe AI",
  description: "Create a free Advance.me account for flashcards and SAT prep.",
};

function SignUpFallback() {
  return (
    <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-6xl items-center px-4 py-8 sm:px-6 md:py-12">
      <div className="grid w-full overflow-hidden rounded-3xl border border-border bg-card shadow-card lg:grid-cols-2">
        <div className="hidden bg-primary lg:block" />
        <div className="flex flex-col items-center justify-center px-5 py-16">
          <LoadingSpinner size="medium" />
          <p className="text-sm text-muted-foreground">Loading sign up…</p>
        </div>
      </div>
    </div>
  );
}

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
    <Suspense fallback={<SignUpFallback />}>
      <SignUpClient returnToParam={first(sp.returnTo)} />
    </Suspense>
  );
}
