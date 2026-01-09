import { Suspense } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import SignUpClient from "./SignUpClient";

function SignUpFallback() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-xl border border-border bg-card px-6 py-8 shadow-sm">
        <LoadingSpinner size="medium" />
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Loading sign up…
        </p>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<SignUpFallback />}>
      <SignUpClient />
    </Suspense>
  );
}
