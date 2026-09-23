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

type PendingAuthAction =
  | "password"
  | "google"
  | "emailLink"
  | "completeLink"
  | "signOut"
  | null;

const SIGN_UP_LINK = {
  text: "Don't have an account?",
  linkText: "Sign up",
  href: "/auth/signup",
};

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
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
  } = useAuth();
  const router = useRouter();

  const [pendingAction, setPendingAction] = useState<PendingAuthAction>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [emailLinkSent, setEmailLinkSent] = useState(false);
  const [isEmailLinkMode, setIsEmailLinkMode] = useState(false);

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

    const completeLink = async () => {
      try {
        setPendingAction("completeLink");
        await completeEmailLinkSignIn();
        window.location.assign(returnTo);
      } catch (err) {
        setError(errorMessage(err, "Could not complete sign-in from this link."));
      } finally {
        setPendingAction(null);
      }
    };

    void completeLink();
  }, [completeEmailLinkSignIn, isAuthLoading, isEmailLinkSignIn, returnTo, user]);

  const handleLogin = async (method: "google" | "password") => {
    try {
      setPendingAction(method);
      setError(null);
      setEmailLinkSent(false);
      if (method === "password") {
        await signIn("password", { email: trimmedEmail, password });
      } else {
        await signIn("google");
      }
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

  if (isAuthLoading) {
    return (
      <AuthLayout title="Checking your session" alternateLink={SIGN_UP_LINK}>
        <AuthSpinner />
      </AuthLayout>
    );
  }

  if (user) {
    return (
      <AuthLayout
        title="You're signed in"
        alternateLink={{ ...SIGN_UP_LINK, text: "Need a different account?" }}
      >
        <SignedInPanel
          email={user.email}
          error={error}
          isBusy={isBusy}
          isSigningOut={pendingAction === "signOut"}
          onContinue={() => router.push(returnTo)}
          onSignOut={handleSignOut}
        />
      </AuthLayout>
    );
  }

  const forgotHref = trimmedEmail
    ? `/auth/forgot-password?email=${encodeURIComponent(trimmedEmail)}`
    : "/auth/forgot-password";

  return (
    <AuthLayout title="Welcome back" alternateLink={SIGN_UP_LINK}>
      {error && <AuthAlert type="error" message={error} />}
      {emailLinkSent && (
        <AuthAlert
          type="success"
          message="Sign-in link sent. Open it from this browser to finish signing in."
        />
      )}
      {isEmailLinkMode && (
        <AuthAlert
          type="success"
          message="Finishing email link sign-in. If this is a different browser, enter your email and continue."
        />
      )}

      <GoogleSignInButton
        onClick={() => handleLogin("google")}
        isLoading={pendingAction === "google"}
        disabled={isBusy}
      />

      <AuthDivider />

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <AuthInput
          id="email"
          name="email"
          type="email"
          label="Email address"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          onChange={(e) => setPassword(e.target.value)}
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
          isLoading={pendingAction === "password"}
          className="w-full"
          size="lg"
        >
          {pendingAction === "password" ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="mt-3">
        {isEmailLinkMode ? (
          <Button
            type="button"
            onClick={handleCompleteEmailLink}
            disabled={isBusy || !trimmedEmail}
            isLoading={pendingAction === "completeLink"}
            variant="outline"
            className="w-full"
            size="lg"
          >
            {pendingAction === "completeLink"
              ? "Completing link..."
              : "Complete email link"}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleEmailLink}
            disabled={isBusy || !trimmedEmail}
            isLoading={pendingAction === "emailLink"}
            variant="ghost"
            className="w-full"
            size="lg"
          >
            {pendingAction !== "emailLink" && <Mail aria-hidden />}
            {pendingAction === "emailLink"
              ? "Sending link..."
              : "Email me a sign-in link instead"}
          </Button>
        )}
      </div>
    </AuthLayout>
  );
}
