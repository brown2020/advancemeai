"use client";

import { useState } from "react";
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

type PendingAuthAction = "password" | "google" | "reset" | "signOut" | null;

export default function SignInClient() {
  const {
    user,
    isLoading: isAuthLoading,
    signIn,
    signOut,
    sendPasswordReset,
  } = useAuth();
  const [pendingAction, setPendingAction] = useState<PendingAuthAction>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeReturnTo(searchParams.get("returnTo") ?? undefined, "/");
  const trimmedEmail = email.trim();
  const isBusy = pendingAction !== null;

  const handleLogin = async (method: "google" | "password") => {
    try {
      setPendingAction(method);
      setError(null);
      setResetEmailSent(false);
      if (method === "password") {
        await signIn("password", { email: trimmedEmail, password });
      } else {
        await signIn("google");
      }
      router.push(returnTo);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to sign in. Please try again."
      );
    } finally {
      setPendingAction(null);
    }
  };

  const handleForgotPassword = async () => {
    try {
      setError(null);
      setResetEmailSent(false);
      if (!trimmedEmail) {
        setError("Please enter your email address");
        return;
      }
      setPendingAction("reset");
      await sendPasswordReset(trimmedEmail);
      setResetEmailSent(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send reset email. Please try again."
      );
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
      setError(
        err instanceof Error
          ? err.message
          : "Failed to sign out. Please try again."
      );
    } finally {
      setPendingAction(null);
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

      <div className="space-y-6">
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
            onClick={handleForgotPassword}
            disabled={isBusy}
            className="text-sm font-medium text-primary hover:opacity-90"
          >
            {pendingAction === "reset" ? "Sending..." : "Forgot password?"}
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
