"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { RolePicker } from "@/components/auth/RolePicker";
import { SignedInPanel } from "@/components/auth/SignedInPanel";
import { VerifyEmailPanel } from "@/components/auth/VerifyEmailPanel";
import type { UserRole } from "@/types/user-profile";

type VerificationAction = "resend" | "refresh" | "signOut" | null;

const SIGN_IN_LINK = {
  text: "Already have an account?",
  linkText: "Sign in",
  href: "/auth/signin",
};

const PASSWORD_MISMATCH = "Passwords don't match";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

export default function SignUpClient({
  returnToParam,
}: {
  returnToParam?: string;
}) {
  const returnTo = safeReturnTo(returnToParam, "/");
  const {
    user,
    isLoading: isAuthLoading,
    signUp,
    signIn,
    signOut,
    sendVerificationEmail,
    refreshAuthState,
  } = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [verificationAction, setVerificationAction] =
    useState<VerificationAction>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [error, setError] = useState<string | null>(null);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(
    null
  );
  const [confirmTouched, setConfirmTouched] = useState(false);

  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;
  const confirmError =
    confirmTouched && passwordsMismatch ? PASSWORD_MISMATCH : undefined;

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      setConfirmTouched(true);
      setError(PASSWORD_MISMATCH);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setVerificationStatus(null);
      await signUp(email, password, { role });
      setVerificationEmailSent(true);
      setVerificationStatus("Verification email sent. Check your inbox.");
    } catch (err) {
      setError(errorMessage(err, "Failed to create account. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setVerificationAction("resend");
      setError(null);
      setVerificationStatus(null);
      await sendVerificationEmail();
      setVerificationEmailSent(true);
      setVerificationStatus("Verification email sent again.");
    } catch (err) {
      setError(
        errorMessage(err, "Failed to send verification email. Please try again.")
      );
      throw err;
    } finally {
      setVerificationAction(null);
    }
  };

  const handleRefreshVerification = async () => {
    try {
      setVerificationAction("refresh");
      setError(null);
      setVerificationStatus(null);
      const status = await refreshAuthState();
      if (status.emailVerified) {
        router.push(returnTo);
        return;
      }
      setVerificationStatus("That email isn't verified yet. Open the link, then try again.");
    } catch (err) {
      setError(
        errorMessage(err, "Could not refresh your email status. Please try again.")
      );
    } finally {
      setVerificationAction(null);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const outcome = await signIn("google");
      if (!outcome.needsEmailVerification) router.push(returnTo);
    } catch (err) {
      setError(
        errorMessage(err, "Failed to sign in with Google. Please try again.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setVerificationAction("signOut");
      setIsLoading(true);
      setError(null);
      await signOut();
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, "Failed to sign out. Please try again."));
    } finally {
      setVerificationAction(null);
      setIsLoading(false);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading || !email || !password || !confirmPassword) return;
    void handleSignUp();
  };

  if (isAuthLoading) {
    return (
      <AuthLayout title="Checking your session" alternateLink={SIGN_IN_LINK}>
        <AuthSpinner />
      </AuthLayout>
    );
  }

  if (user?.isPasswordUser && !user.emailVerified) {
    return (
      <AuthLayout
        title="Verify your email"
        alternateLink={{ ...SIGN_IN_LINK, text: "Need a different account?" }}
      >
        <VerifyEmailPanel
          email={user.email}
          error={error}
          status={
            verificationStatus ??
            (verificationEmailSent ? "Verification email sent. Check your inbox." : null)
          }
          pending={verificationAction}
          cooldownOnMount={verificationEmailSent}
          onResend={handleResendVerification}
          onRefresh={handleRefreshVerification}
          onSignOut={handleSignOut}
        />
      </AuthLayout>
    );
  }

  if (user) {
    return (
      <AuthLayout
        title="You're signed in"
        alternateLink={{ ...SIGN_IN_LINK, text: "Need a different account?" }}
      >
        <SignedInPanel
          email={user.email}
          error={error}
          isBusy={isLoading}
          isSigningOut={isLoading}
          onContinue={() => router.push(returnTo)}
          onSignOut={handleSignOut}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      alternateLink={SIGN_IN_LINK}
      footer={
        <p className="text-center text-xs text-muted-foreground">
          By signing up, you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
      }
    >
      {error && error !== confirmError && <AuthAlert type="error" message={error} />}

      <GoogleSignInButton
        onClick={handleGoogleSignIn}
        isLoading={isLoading}
        disabled={isLoading}
        label="Sign up with Google"
      />

      <AuthDivider />

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <RolePicker value={role} onChange={setRole} disabled={isLoading} />

        <AuthInput
          id="email"
          name="email"
          type="email"
          label="Email address"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          placeholder="you@example.com"
        />

        <AuthInput
          id="password"
          name="password"
          type="password"
          label="Password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          placeholder="Create a password"
        />

        <AuthInput
          id="confirm-password"
          name="confirm-password"
          type="password"
          label="Confirm password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (error === PASSWORD_MISMATCH) setError(null);
          }}
          onBlur={() => setConfirmTouched(true)}
          disabled={isLoading}
          placeholder="Type it again"
          error={confirmError}
        />

        <Button
          type="submit"
          disabled={isLoading || !email || !password || !confirmPassword}
          isLoading={isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </AuthLayout>
  );
}
