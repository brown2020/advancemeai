"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthAlert, AuthInput } from "@/components/auth/AuthLayout";

const RESEND_COOLDOWN_SECONDS = 60;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type PendingAction = "resend" | "refresh" | "changeEmail" | "back" | "signOut" | null;

function cooldownSeconds(cooldownOnMount: boolean): number {
  if (cooldownOnMount) return RESEND_COOLDOWN_SECONDS;
  return 0;
}

function resendIsDisabled(busy: boolean, secondsLeft: number): boolean {
  if (busy) return true;
  return secondsLeft > 0;
}

function resendButtonLabel(isSending: boolean, secondsLeft: number): string {
  if (isSending) return "Sending...";
  if (secondsLeft > 0) return `Resend verification email (${secondsLeft}s)`;
  return "Resend verification email";
}

function actionLabel(isPending: boolean, busyLabel: string, idleLabel: string): string {
  if (isPending) return busyLabel;
  return idleLabel;
}

function changeEmailIsDisabled(busy: boolean, nextEmail: string): boolean {
  if (busy) return true;
  return nextEmail.trim().length === 0;
}

function changeEmailLabel(isSending: boolean): string {
  if (isSending) return "Sending...";
  return "Send link to this email";
}

function optionalFieldError(error: string | null): string | undefined {
  if (error === null) return undefined;
  return error;
}

function isEmailAddress(value: string): boolean {
  return EMAIL_PATTERN.test(value);
}

async function resendVerification(
  secondsLeft: number,
  busy: boolean,
  onResend: () => Promise<void>,
  setSecondsLeft: (value: number) => void,
): Promise<void> {
  if (secondsLeft > 0) return;
  if (busy) return;
  try {
    await onResend();
    setSecondsLeft(RESEND_COOLDOWN_SECONDS);
  } catch {
    // The parent records the error.
  }
}

function updateDraftEmail(
  value: string,
  emailError: string | null,
  setNextEmail: (value: string) => void,
  setEmailError: (value: string | null) => void,
): void {
  setNextEmail(value);
  if (emailError) setEmailError(null);
}

async function submitDraftEmail(
  event: FormEvent,
  nextEmail: string,
  onChangeEmail: (nextEmail: string) => Promise<void>,
  setEmailError: (value: string | null) => void,
  onClose: () => void,
): Promise<void> {
  event.preventDefault();
  const trimmed = nextEmail.trim();
  if (!isEmailAddress(trimmed)) {
    setEmailError("Enter a valid email address.");
    return;
  }
  setEmailError(null);
  try {
    await onChangeEmail(trimmed);
    onClose();
  } catch {
    // The parent records the error.
  }
}

function verifyEmailCopy(email: string | null | undefined, status: string | null): ReactNode {
  if (!email) return "Verify your email before continuing.";
  if (!status) {
    return (
      <>
        Verify{" "}
        <span className="break-all font-semibold text-foreground">{email}</span>{" "}
        before continuing. Open the link in your inbox, then confirm below.
      </>
    );
  }
  return (
    <>
      We sent a verification link to{" "}
      <span className="break-all font-semibold text-foreground">{email}</span>
      .
    </>
  );
}

function VerifyEmailAlerts({ error, status }: { error: string | null; status: string | null }) {
  return (
    <>
      {error ? <AuthAlert type="error" message={error} /> : null}
      {status ? <AuthAlert type="success" message={status} /> : null}
    </>
  );
}

function VerifyEmailMessage({
  email,
  status,
}: {
  email?: string | null;
  status: string | null;
}) {
  return (
    <div className="mb-6 flex items-center gap-3 rounded-2xl bg-secondary p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
        <MailCheck className="size-5" aria-hidden />
      </span>
      <p className="min-w-0 text-sm text-muted-foreground">{verifyEmailCopy(email, status)}</p>
    </div>
  );
}

function VerifyEmailResendButton({
  cooldownOnMount,
  pending,
  busy,
  onResend,
}: {
  cooldownOnMount: boolean;
  pending: PendingAction;
  busy: boolean;
  onResend: () => Promise<void>;
}) {
  const [secondsLeft, setSecondsLeft] = useState(() => cooldownSeconds(cooldownOnMount));

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setTimeout(() => {
      setSecondsLeft((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  const isSending = pending === "resend";

  return (
    <Button
      type="button"
      onClick={() => void resendVerification(secondsLeft, busy, onResend, setSecondsLeft)}
      disabled={resendIsDisabled(busy, secondsLeft)}
      isLoading={isSending}
      variant="outline"
      className="w-full"
      size="lg"
    >
      {resendButtonLabel(isSending, secondsLeft)}
    </Button>
  );
}

function PendingActionButton({
  pending,
  action,
  busy,
  busyLabel,
  idleLabel,
  onClick,
  variant,
}: {
  pending: PendingAction;
  action: Exclude<PendingAction, null>;
  busy: boolean;
  busyLabel: string;
  idleLabel: string;
  onClick: () => Promise<void>;
  variant?: "ghost" | "outline";
}) {
  const isPending = pending === action;
  return (
    <Button
      type="button"
      onClick={() => void onClick()}
      disabled={busy}
      isLoading={isPending}
      variant={variant}
      className="w-full"
      size="lg"
    >
      {actionLabel(isPending, busyLabel, idleLabel)}
    </Button>
  );
}

function ChangeEmailForm({
  busy,
  pending,
  onChangeEmail,
  onClose,
}: {
  busy: boolean;
  pending: PendingAction;
  onChangeEmail: (nextEmail: string) => Promise<void>;
  onClose: () => void;
}) {
  const [nextEmail, setNextEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const isSending = pending === "changeEmail";

  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => void submitDraftEmail(event, nextEmail, onChangeEmail, setEmailError, onClose)}
    >
      <AuthInput
        id="change-email"
        name="email"
        type="email"
        label="Different email"
        autoComplete="email"
        required
        value={nextEmail}
        onChange={(event) => updateDraftEmail(event.target.value, emailError, setNextEmail, setEmailError)}
        disabled={busy}
        placeholder="you@example.com"
        error={optionalFieldError(emailError)}
      />
      <Button
        type="submit"
        disabled={changeEmailIsDisabled(busy, nextEmail)}
        isLoading={isSending}
        className="w-full"
        size="lg"
      >
        {changeEmailLabel(isSending)}
      </Button>
      <Button type="button" variant="ghost" className="w-full" size="lg" disabled={busy} onClick={onClose}>
        Cancel
      </Button>
    </form>
  );
}

function ChangeEmailSection({
  open,
  busy,
  pending,
  onChangeEmail,
  onOpen,
  onClose,
}: {
  open: boolean;
  busy: boolean;
  pending: PendingAction;
  onChangeEmail: (nextEmail: string) => Promise<void>;
  onOpen: () => void;
  onClose: () => void;
}) {
  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full"
        size="lg"
        disabled={busy}
        onClick={onOpen}
      >
        Use a different email
      </Button>
    );
  }

  return (
    <ChangeEmailForm busy={busy} pending={pending} onChangeEmail={onChangeEmail} onClose={onClose} />
  );
}

export function VerifyEmailPanel({
  email,
  error,
  status,
  pending,
  cooldownOnMount = false,
  onResend,
  onRefresh,
  onChangeEmail,
  onBackToSignIn,
  onSignOut,
}: {
  email?: string | null;
  error: string | null;
  status: string | null;
  pending: PendingAction;
  cooldownOnMount?: boolean;
  onResend: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onChangeEmail: (nextEmail: string) => Promise<void>;
  onBackToSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
}) {
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const busy = pending !== null;

  return (
    <>
      <VerifyEmailAlerts error={error} status={status} />
      <VerifyEmailMessage email={email} status={status} />
      <p className="mb-4 text-sm text-muted-foreground">
        If it never arrives, check your spam or junk folder, then use Resend
        verification email. You can send the link to a different address, or go
        back to sign-in.
      </p>
      <div className="grid gap-3">
        <PendingActionButton
          pending={pending}
          action="refresh"
          busy={busy}
          busyLabel="Checking..."
          idleLabel="I've verified my email"
          onClick={onRefresh}
        />
        <VerifyEmailResendButton
          key={String(cooldownOnMount)}
          cooldownOnMount={cooldownOnMount}
          pending={pending}
          busy={busy}
          onResend={onResend}
        />
        <ChangeEmailSection
          open={showChangeEmail}
          busy={busy}
          pending={pending}
          onChangeEmail={onChangeEmail}
          onOpen={() => setShowChangeEmail(true)}
          onClose={() => setShowChangeEmail(false)}
        />
        <PendingActionButton
          pending={pending}
          action="back"
          busy={busy}
          busyLabel="Returning..."
          idleLabel="Back to sign-in"
          onClick={onBackToSignIn}
          variant="ghost"
        />
        <PendingActionButton
          pending={pending}
          action="signOut"
          busy={busy}
          busyLabel="Signing out..."
          idleLabel="Sign out"
          onClick={onSignOut}
          variant="ghost"
        />
      </div>
    </>
  );
}
