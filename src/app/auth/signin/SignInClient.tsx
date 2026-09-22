"use client";

import { useEffect, useRef, useState, useReducer} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { safeReturnTo } from "@/lib/safe-return-to";
import { Button } from "@/components/ui/button";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import {
  AuthLayout,
  AuthAlert,
  AuthInput,
  AuthDivider,
} from "@/components/auth/AuthLayout";

type PendingAuthAction =
  | "password"
  | "google"
  | "reset"
  | "emailLink"
  | "completeLink"
  | "signOut"
  | null;

export default function SignInClient() {
  const {
    user,
    isLoading: isAuthLoading,
    signIn,
    signOut,
    sendEmailSignInLink,
    isEmailLinkSignIn,
    completeEmailLinkSignIn,
  } = useAuth();
  const [state, dispatch] = useReducer(
    (s: any, p: Record<string, any>): any => {
      const patch: Record<string, any> = {};
      for (const key of Object.keys(p)) {
        const value = p[key];
        patch[key] = typeof value === "function" ? value(s[key]) : value;
      }
      return { ...s, ...patch };
    },
    {
    pendingAction: null,
    email: "",
    password: "",
    error: null,
    resetEmailSent: false,
    emailLinkSent: false,
    isEmailLinkMode: false,
    }
  );
  const { pendingAction, email, password, error, resetEmailSent, emailLinkSent, isEmailLinkMode } = state as any;
  const assignPendingAction = (value: any) => dispatch({ pendingAction: value });
  const assignEmail = (value: any) => dispatch({ email: value });
  const assignPassword = (value: any) => dispatch({ password: value });
  const assignError = (value: any) => dispatch({ error: value });
  const assignResetEmailSent = (value: any) => dispatch({ resetEmailSent: value });
  const assignEmailLinkSent = (value: any) => dispatch({ emailLinkSent: value });
  const assignIsEmailLinkMode = (value: any) => dispatch({ isEmailLinkMode: value });

  const emailLinkAutoAttempted = useRef(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get("returnTo") ?? undefined, "/");
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
    assignIsEmailLinkMode(true);
    assignError(null);
    assignEmailLinkSent(false);
    assignResetEmailSent(false);

    const completeLink = async () => {
      try {
        assignPendingAction("completeLink");
        await completeEmailLinkSignIn();
        router.replace(returnTo);
      } catch (err) {
        assignError(
          err instanceof Error
            ? err.message
            : "Could not complete sign-in from this link."
        );
      } finally {
        assignPendingAction(null);
      }
    };

    void completeLink();
  }, [
    completeEmailLinkSignIn,
    isAuthLoading,
    isEmailLinkSignIn,
    returnTo,
    router,
    user,
  ]);

  const handleLogin = async (method: "google" | "password") => {
    try {
      assignPendingAction(method);
      assignError(null);
      assignResetEmailSent(false);
      assignEmailLinkSent(false);
      if (method === "password") {
        await signIn("password", { email: trimmedEmail, password });
      } else {
        await signIn("google");
      }
      router.push(returnTo);
    } catch (err) {
      assignError(
        err instanceof Error
          ? err.message
          : "Failed to sign in. Please try again."
      );
    } finally {
      assignPendingAction(null);
    }
  };


  const handleEmailLink = async () => {
    try {
      assignError(null);
      assignResetEmailSent(false);
      assignEmailLinkSent(false);
      if (!trimmedEmail) {
        assignError("Please enter your email address");
        return;
      }
      assignPendingAction("emailLink");
      await sendEmailSignInLink(trimmedEmail);
      assignEmailLinkSent(true);
    } catch (err) {
      assignError(
        err instanceof Error
          ? err.message
          : "Failed to send sign-in link. Please try again."
      );
    } finally {
      assignPendingAction(null);
    }
  };

  const handleCompleteEmailLink = async () => {
    try {
      assignError(null);
      if (!trimmedEmail) {
        assignError("Please enter the email address you used for this link.");
        return;
      }
      assignPendingAction("completeLink");
      await completeEmailLinkSignIn(trimmedEmail);
      router.replace(returnTo);
    } catch (err) {
      assignError(
        err instanceof Error
          ? err.message
          : "Could not complete sign-in from this link."
      );
    } finally {
      assignPendingAction(null);
    }
  };

  const handleSignOut = async () => {
    try {
      assignPendingAction("signOut");
      assignError(null);
      await signOut();
      router.push("/");
      router.refresh();
    } catch (err) {
      assignError(
        err instanceof Error
          ? err.message
          : "Failed to sign out. Please try again."
      );
    } finally {
      assignPendingAction(null);
    }
  };

  if (isAuthLoading) {
    return (
      <AuthLayout
        title="Checking your session"
        alternateLink={{
          text: "Need a new account?",
          linkText: "Sign up",
          href: "/auth/signup",
        }}
      >
        <div className="flex justify-center py-6">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </AuthLayout>
    );
  }

  if (user) {
    return (
      <AuthLayout
        title="You're signed in"
        alternateLink={{
          text: "Need a different account?",
          linkText: "Sign up",
          href: "/auth/signup",
        }}
      >
        {error && <AuthAlert type="error" message={error} />}
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {user.email
              ? `You're currently signed in as ${user.email}.`
              : "You're currently signed in."}
          </p>
          <Button
            onClick={() => router.push(returnTo)}
            disabled={isBusy}
            className="w-full"
            size="lg"
          >
            Continue
          </Button>
          <Button
            onClick={handleSignOut}
            disabled={isBusy}
            isLoading={pendingAction === "signOut"}
            variant="secondary"
            className="w-full"
            size="lg"
          >
            {pendingAction === "signOut" ? "Signing out..." : "Sign out"}
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Sign in to your account"
      alternateLink={{
        text: "Don't have an account?",
        linkText: "Sign up",
        href: "/auth/signup",
      }}
    >
      {error && <AuthAlert type="error" message={error} />}
      {resetEmailSent && (
        <AuthAlert
          type="success"
          message="Password reset email sent. Please check your inbox."
        />
      )}
      {emailLinkSent && (
        <AuthAlert
          type="success"
          message="Sign-in link sent. Open it from this browser to finish signing in."
        />
      )}
      {isEmailLinkMode && !user && (
        <AuthAlert
          type="success"
          message="Finishing email link sign-in. If this is a different browser, enter your email and continue."
        />
      )}

      <div className="space-y-6">
        <AuthInput
          id="email"
          name="email"
          type="email"
          label="Email address"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => assignEmail(e.target.value)}
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
          onChange={(e) => assignPassword(e.target.value)}
          disabled={isBusy}
          placeholder="••••••••"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 rounded border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            />
            <label
              htmlFor="remember-me"
              className="ml-2 block text-sm text-muted-foreground"
            >
              Remember me
            </label>
          </div>

          <button
            type="button"
            onClick={() => {
              const q = trimmedEmail
                ? `?email=${encodeURIComponent(trimmedEmail)}`
                : "";
              router.push(`/auth/forgot-password${q}`);
            }}
            disabled={isBusy}
            className="text-sm font-medium text-primary hover:opacity-90"
          >
            Forgot password?
          </button>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => handleLogin("password")}
            disabled={isBusy || !trimmedEmail || !password}
            isLoading={pendingAction === "password"}
            className="w-full"
            size="lg"
          >
            {pendingAction === "password" ? "Signing in..." : "Sign in"}
          </Button>

          {isEmailLinkMode ? (
            <Button
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
              onClick={handleEmailLink}
              disabled={isBusy || !trimmedEmail}
              isLoading={pendingAction === "emailLink"}
              variant="outline"
              className="w-full"
              size="lg"
            >
              {pendingAction === "emailLink"
                ? "Sending link..."
                : "Email me a sign-in link"}
            </Button>
          )}

          <AuthDivider />

          <GoogleSignInButton
            onClick={() => handleLogin("google")}
            isLoading={pendingAction === "google"}
            disabled={isBusy}
          />
        </div>
      </div>
    </AuthLayout>
  );
}

