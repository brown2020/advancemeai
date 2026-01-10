import { Suspense } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import SignInClient from "./SignInClient";
import { redirect } from "next/navigation";
import { getServerSession, safeReturnTo } from "@/lib/server-session";

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

export default async function SignInPage({
  searchParams,
}: {
  searchParams?: { returnTo?: string | string[] };
}) {
  const returnTo = safeReturnTo(searchParams?.returnTo, "/");
  const { isAvailable, user } = await getServerSession();

  // If we can verify sessions server-side and the user already has one,
  // skip rendering the sign-in form entirely.
  if (isAvailable && user) {
    redirect(returnTo);
  }

  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInClient />
    </Suspense>
  );
}
