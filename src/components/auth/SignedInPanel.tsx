"use client";

import { UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthAlert } from "@/components/auth/AuthLayout";

interface SignedInPanelProps {
  email?: string | null;
  error: string | null;
  isBusy: boolean;
  isSigningOut: boolean;
  onContinue: () => void;
  onSignOut: () => void;
}

/** Shown on auth pages when a user is already signed in. */
export function SignedInPanel({
  email,
  error,
  isBusy,
  isSigningOut,
  onContinue,
  onSignOut,
}: SignedInPanelProps) {
  return (
    <>
      {error && <AuthAlert type="error" message={error} />}
      <div className="mb-6 flex items-center gap-3 rounded-2xl bg-secondary p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
          <UserCheck className="size-5" aria-hidden />
        </span>
        <p className="min-w-0 text-sm text-muted-foreground">
          {email ? (
            <>
              You&apos;re currently signed in as{" "}
              <span className="break-all font-semibold text-foreground">{email}</span>.
            </>
          ) : (
            "You're currently signed in."
          )}
        </p>
      </div>
      <div className="grid gap-3">
        <Button onClick={onContinue} disabled={isBusy} className="w-full" size="lg">
          Continue
        </Button>
        <Button
          onClick={onSignOut}
          disabled={isBusy}
          isLoading={isSigningOut}
          variant="outline"
          className="w-full"
          size="lg"
        >
          {isSigningOut ? "Signing out..." : "Sign out"}
        </Button>
      </div>
    </>
  );
}
