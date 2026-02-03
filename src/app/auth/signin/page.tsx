import { Suspense } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import SignInClient from "./SignInClient";

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

export default function SignInPage() {
  // Let the client-side component handle auth state and redirects
  // to avoid race conditions between server session and Firebase client auth
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInClient />
    </Suspense>
  );
}
