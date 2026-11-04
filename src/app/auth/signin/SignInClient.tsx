"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { safeReturnTo } from "@/lib/safe-return-to";
import { Button } from "@/components/ui/button";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import {
  AuthLayout,
  AuthAlert,
  AuthInput,
  AuthDivider,
  AuthSpinner,
} from "@/components/auth/AuthLayout";
import { SignedInPanel } from "@/components/auth/SignedInPanel";
import { VerifyEmailPanel } from "@/components/auth/VerifyEmailPanel";

type PendingAuthAction =
  | "password"
  | "google"
  | "emailLink"
  | "completeLink"
  | "resend"
  | "refresh"
  | "changeEmail"
  | "back"
  | "signOut"
  | null;

type VerificationPending = Exclude<
  PendingAuthAction,
  "password" | "google" | "emailLink" | "completeLink"
>;

type SignedInUser = {
  email: string | null;
  isPasswordUser: boolean;
  emailVerified: boolean;
};

const SIGN_UP_LINK = {
  text: "Don't have an account?",
  linkText: "Sign up",
  href: "/auth/signup",
};

const DIFFERENT_ACCOUNT_LINK = { ...SIGN_UP_LINK, text: "Need a different account?" };

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function needsPasswordVerification(user: SignedInUser): boolean {
  return user.isPasswordUser && !user.emailVerified;
}

function verificationPending(action: PendingAuthAction): VerificationPending {
  if (
    action === "resend" ||
    action === "refresh" ||
    action === "changeEmail" ||
    action === "back" ||
    action === "signOut"
  ) {
    return action;
  }
  return null;
}

function forgotPasswordHref(trimmedEmail: string): string {
  if (!trimmedEmail) return "/auth/forgot-password";
  return `/auth/forgot-password?email=${encodeURIComponent(trimmedEmail)}`;
}

function CheckingSession() {
  return (
    <AuthLayout title="Checking your session" alternateLink={SIGN_UP_LINK}>
      <AuthSpinner />
    </AuthLayout>
  );
}

function SignInAlerts({
  error,
  emailLinkSent,
  isEmailLinkMode,
}: {
  error: string | null;
  emailLinkSent: boolean;
  isEmailLinkMode: boolean;
}) {
  return (
    <>
      {error ? <AuthAlert type="error" message={error} /> : null}
      {emailLinkSent ? (
        <AuthAlert
          type="success"
          message="Sign-in link sent. Open it from this browser to finish signing in."
        />
      ) : null}
      {isEmailLinkMode ? (
        <AuthAlert
          type="success"
          message="Finishing email link sign-in. If this is a different browser, enter your email and continue."
        />
      ) : null}
    </>
  );
}

function SignInCredentialsForm({
  email,
  password,
  trimmedEmail,
  isBusy,
  isPasswordPending,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: {
  email: string;
  password: string;
  trimmedEmail: string;
  isBusy: boolean;
  isPasswordPending: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const forgotHref = forgotPasswordHref(trimmedEmail);
  return (
    <form className="space-y-5" onSubmit={onSubmit} noValidate>
      <AuthInput
        id="email"
        name="email"
        type="email"
        label="Email address"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => onEmailChange(e.target.value)}
        disabled={isBusy}
        placeholder="you@example.com"
      />

      <AuthInput
        id="password"
        name="password"
        type="password"
        label="Password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        disabled={isBusy}
        placeholder="Your password"
        labelAction={
          <Link
            href={forgotHref}
            aria-disabled={isBusy || undefined}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            Forgot password?
          </Link>
        }
      />

      <Button
        type="submit"
        disabled={isBusy || !trimmedEmail || !password}
        isLoading={isPasswordPending}
        className="w-full"
        size="lg"
      >
        {isPasswordPending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}

function CompleteEmailLinkButton({
  isBusy,
  trimmedEmail,
  isPending,
  onComplete,
}: {
  isBusy: boolean;
  trimmedEmail: string;
  isPending: boolean;
  onComplete: () => void;
}) {
  return (
    <Button
      type="button"
      onClick={onComplete}
      disabled={isBusy || !trimmedEmail}
      isLoading={isPending}
      variant="outline"
      className="w-full"
      size="lg"
    >
      {isPending ? "Completing link..." : "Complete email link"}
    </Button>
  );
}

function SendEmailLinkButton({
  isBusy,
  trimmedEmail,
  isPending,
  onSend,
}: {
  isBusy: boolean;
  trimmedEmail: string;
  isPending: boolean;
  onSend: () => void;
}) {
  return (
    <Button
      type="button"
      onClick={onSend}
      disabled={isBusy || !trimmedEmail}
      isLoading={isPending}
      variant="ghost"
      className="w-full"
      size="lg"
    >
      {isPending ? null : <Mail aria-hidden />}
      {isPending ? "Sending link..." : "Email me a sign-in link instead"}
    </Button>
  );
}

function EmailLinkActions({
  isEmailLinkMode,
  isBusy,
  trimmedEmail,
  pendingAction,
  onComplete,
  onSend,
}: {
  isEmailLinkMode: boolean;
  isBusy: boolean;
  trimmedEmail: string;
  pendingAction: PendingAuthAction;
  onComplete: () => void;
  onSend: () => void;
}) {
  return (
    <div className="mt-3">
      {isEmailLinkMode ? (
        <CompleteEmailLinkButton
          isBusy={isBusy}
          trimmedEmail={trimmedEmail}
          isPending={pendingAction === "completeLink"}
          onComplete={onComplete}
        />
      ) : (
        <SendEmailLinkButton
          isBusy={isBusy}
          trimmedEmail={trimmedEmail}
          isPending={pendingAction === "emailLink"}
          onSend={onSend}
        />
      )}
    </div>
  );
}

function VerifySignInScreen({
  user,
  error,
  status,
  pendingAction,
  onResend,
  onRefresh,
  onChangeEmail,
  onBackToSignIn,
  onSignOut,
}: {
  user: SignedInUser;
  error: string | null;
  status: string | null;
  pendingAction: PendingAuthAction;
  onResend: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onChangeEmail: (nextEmail: string) => Promise<void>;
  onBackToSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
}) {
  return (
    <AuthLayout title="Verify your email" alternateLink={DIFFERENT_ACCOUNT_LINK}>
      <VerifyEmailPanel
        email={user.email}
        error={error}
        status={status}
        pending={verificationPending(pendingAction)}
        onResend={onResend}
        onRefresh={onRefresh}
        onChangeEmail={onChangeEmail}
        onBackToSignIn={onBackToSignIn}
        onSignOut={onSignOut}
      />
    </AuthLayout>
  );
}

function SignedInScreen({
  user,
  error,
  isBusy,
  isSigningOut,
  onContinue,
  onSignOut,
}: {
  user: SignedInUser;
  error: string | null;
  isBusy: boolean;
  isSigningOut: boolean;
  onContinue: () => void;
  onSignOut: () => Promise<void>;
}) {
  return (
    <AuthLayout title="You're signed in" alternateLink={DIFFERENT_ACCOUNT_LINK}>
      <SignedInPanel
        email={user.email}
        error={error}
        isBusy={isBusy}
        isSigningOut={isSigningOut}
        onContinue={onContinue}
        onSignOut={onSignOut}
      />
    </AuthLayout>
  );
}

export default function SignInClient({
  returnToParam,
}: {
  returnToParam?: string;
}) {
  const returnTo = safeReturnTo(returnToParam, "/");
  const {
    user,
    isLoading: isAuthLoading,
    signIn,
    signOut,
    sendEmailSignInLink,
    isEmailLinkSignIn,
    completeEmailLinkSignIn,
    sendVerificationEmail,
    changeUnverifiedEmail,
    refreshAuthState,
  } = useAuth();
  const router = useRouter();

  const [pendingAction, setPendingAction] = useState<PendingAuthAction>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [emailLinkSent, setEmailLinkSent] = useState(false);
  const [isEmailLinkMode, setIsEmailLinkMode] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);

  const emailLinkAutoAttempted = useRef(false);
  const trimmedEmail = email.trim();
  const isBusy = pendingAction !== null;

  useEffect(() => {
    if (
      isAuthLoading ||
      user ||
      emailLinkAutoAttempted.current ||
      !isEmailLinkSignIn()
    ) {
      return;
    }

    emailLinkAutoAttempted.current = true;
    setIsEmailLinkMode(true);
    setError(null);
    setEmailLinkSent(false);

    let cancelled = false;
    const completeLink = async () => {
      try {
        setPendingAction("completeLink");
        await completeEmailLinkSignIn();
        window.location.assign(returnTo);
      } catch (err) {
        if (cancelled) return;
        setError(errorMessage(err, "Could not complete sign-in from this link."));
      } finally {
        if (cancelled) return;
        setPendingAction(null);
      }
    };

    void completeLink();
    return () => {
      cancelled = true;
    };
  }, [completeEmailLinkSignIn, isAuthLoading, isEmailLinkSignIn, returnTo, user]);

  const handleLogin = async (method: "google" | "password") => {
    try {
      setPendingAction(method);
      setError(null);
      setEmailLinkSent(false);
      const outcome =
        method === "password"
          ? await signIn("password", { email: trimmedEmail, password })
          : await signIn("google");
      if (outcome.needsEmailVerification) return;
      router.push(returnTo);
    } catch (err) {
      setError(errorMessage(err, "Failed to sign in. Please try again."));
    } finally {
      setPendingAction(null);
    }
  };

  const handleEmailLink = async () => {
    try {
      setError(null);
      setEmailLinkSent(false);
      if (!trimmedEmail) {
        setError("Please enter your email address");
        return;
      }
      setPendingAction("emailLink");
      await sendEmailSignInLink(trimmedEmail);
      setEmailLinkSent(true);
    } catch (err) {
      setError(errorMessage(err, "Failed to send sign-in link. Please try again."));
    } finally {
      setPendingAction(null);
    }
  };

  const handleCompleteEmailLink = async () => {
    try {
      setError(null);
      if (!trimmedEmail) {
        setError("Please enter the email address you used for this link.");
        return;
      }
      setPendingAction("completeLink");
      await completeEmailLinkSignIn(trimmedEmail);
      router.replace(returnTo);
    } catch (err) {
      setError(errorMessage(err, "Could not complete sign-in from this link."));
    } finally {
      setPendingAction(null);
    }
  };

  const handleResendVerification = async () => {
    try {
      setPendingAction("resend");
      setError(null);
      setVerificationStatus(null);
      await sendVerificationEmail();
      setVerificationStatus("Verification email sent. Check your inbox.");
    } catch (err) {
      setError(errorMessage(err, "Failed to send verification email. Please try again."));
      throw err;
    } finally {
      setPendingAction(null);
    }
  };

  const handleRefreshVerification = async () => {
    try {
      setPendingAction("refresh");
      setError(null);
      setVerificationStatus(null);
      const status = await refreshAuthState();
      if (status.emailVerified) {
        router.push(returnTo);
        return;
      }
      setVerificationStatus("That email isn't verified yet. Open the link, then try again.");
    } catch (err) {
      setError(errorMessage(err, "Could not refresh your email status. Please try again."));
    } finally {
      setPendingAction(null);
    }
  };

  const handleChangeEmail = async (nextEmail: string) => {
    try {
      setPendingAction("changeEmail");
      setError(null);
      setVerificationStatus(null);
      await changeUnverifiedEmail(nextEmail);
      setVerificationStatus(
        `Verification link sent to ${nextEmail}. Open it to confirm that address, then choose I've verified my email.`
      );
    } catch (err) {
      setError(errorMessage(err, "Failed to send a verification email to that address."));
      throw err;
    } finally {
      setPendingAction(null);
    }
  };

  const handleBackToSignIn = async () => {
    try {
      setPendingAction("back");
      setError(null);
      await signOut();
      router.replace("/auth/signin");
    } catch (err) {
      setError(errorMessage(err, "Failed to return to sign-in. Please try again."));
    } finally {
      setPendingAction(null);
    }
  };

  const handleSignOut = async () => {
    try {
      setPendingAction("signOut");
      setError(null);
      await signOut();
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, "Failed to sign out. Please try again."));
    } finally {
      setPendingAction(null);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBusy || !trimmedEmail || !password) return;
    void handleLogin("password");
  };

  if (isAuthLoading) return <CheckingSession />;

  if (user && needsPasswordVerification(user)) {
    return (
      <VerifySignInScreen
        user={user}
        error={error}
        status={verificationStatus}
        pendingAction={pendingAction}
        onResend={handleResendVerification}
        onRefresh={handleRefreshVerification}
        onChangeEmail={handleChangeEmail}
        onBackToSignIn={handleBackToSignIn}
        onSignOut={handleSignOut}
      />
    );
  }

  if (user) {
    return (
      <SignedInScreen
        user={user}
        error={error}
        isBusy={isBusy}
        isSigningOut={pendingAction === "signOut"}
        onContinue={() => router.push(returnTo)}
        onSignOut={handleSignOut}
      />
    );
  }

  return (
    <AuthLayout title="Welcome back" alternateLink={SIGN_UP_LINK}>
      <SignInAlerts
        error={error}
        emailLinkSent={emailLinkSent}
        isEmailLinkMode={isEmailLinkMode}
      />

      <GoogleSignInButton
        onClick={() => void handleLogin("google")}
        isLoading={pendingAction === "google"}
        disabled={isBusy}
      />

      <AuthDivider />

      <SignInCredentialsForm
        email={email}
        password={password}
        trimmedEmail={trimmedEmail}
        isBusy={isBusy}
        isPasswordPending={pendingAction === "password"}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={handleSubmit}
      />

      <EmailLinkActions
        isEmailLinkMode={isEmailLinkMode}
        isBusy={isBusy}
        trimmedEmail={trimmedEmail}
        pendingAction={pendingAction}
        onComplete={() => void handleCompleteEmailLink()}
        onSend={() => void handleEmailLink()}
      />
    </AuthLayout>
  );
}
