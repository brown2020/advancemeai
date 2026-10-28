"use client";

import { useEffect, useRef, useState } from "react";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthAlert } from "@/components/auth/AuthLayout";

const RESEND_COOLDOWN_SECONDS = 60;

type PendingAction = "resend" | "refresh" | "signOut" | null;

export function VerifyEmailPanel({
  email,
  error,
  status,
  pending,
  cooldownOnMount = false,
  onResend,
  onRefresh,
  onSignOut,
}: {
  email?: string | null;
  error: string | null;
  status: string | null;
  pending: PendingAction;
  cooldownOnMount?: boolean;
  onResend: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onSignOut: () => Promise<void>;
}) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const cooldownStarted = useRef(false);
  const busy = pending !== null;

  useEffect(() => {
    if (!cooldownOnMount || cooldownStarted.current) return;
    cooldownStarted.current = true;
    setSecondsLeft(RESEND_COOLDOWN_SECONDS);
  }, [cooldownOnMount]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setTimeout(() => {
      setSecondsLeft((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  const handleResend = async () => {
    if (secondsLeft > 0 || busy) return;
    try {
      await onResend();
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
    } catch {
      // The parent records the error.
    }
  };

  const resendLabel =
    pending === "resend"
      ? "Sending..."
      : secondsLeft > 0
        ? `Resend verification email (${secondsLeft}s)`
        : "Resend verification email";

  return (
    <>
      {error && <AuthAlert type="error" message={error} />}
      {status && <AuthAlert type="success" message={status} />}
      <div className="mb-6 flex items-center gap-3 rounded-2xl bg-secondary p-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
          <MailCheck className="size-5" aria-hidden />
        </span>
        <p className="min-w-0 text-sm text-muted-foreground">
          {email ? (
            status ? (
              <>
                We sent a verification link to{" "}
                <span className="break-all font-semibold text-foreground">{email}</span>
                .
              </>
            ) : (
              <>
                Verify{" "}
                <span className="break-all font-semibold text-foreground">{email}</span>{" "}
                before continuing. Open the link in your inbox, then confirm below.
              </>
            )
          ) : (
            "Verify your email before continuing."
          )}
        </p>
      </div>
      <div className="grid gap-3">
        <Button
          type="button"
          onClick={() => void onRefresh()}
          disabled={busy}
          isLoading={pending === "refresh"}
          className="w-full"
          size="lg"
        >
          {pending === "refresh" ? "Checking..." : "I've verified my email"}
        </Button>
        <Button
          type="button"
          onClick={() => void handleResend()}
          disabled={busy || secondsLeft > 0}
          isLoading={pending === "resend"}
          variant="outline"
          className="w-full"
          size="lg"
        >
          {resendLabel}
        </Button>
        <Button
          type="button"
          onClick={() => void onSignOut()}
          disabled={busy}
          isLoading={pending === "signOut"}
          variant="ghost"
          className="w-full"
          size="lg"
        >
          {pending === "signOut" ? "Signing out..." : "Sign out"}
        </Button>
      </div>
    </>
  );
}
