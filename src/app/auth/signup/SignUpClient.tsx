"use client";

import Link from "next/link";

import { useState, useReducer} from "react";
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
} from "@/components/auth/AuthLayout";
import type { UserRole } from "@/types/user-profile";
import { GraduationCap, BookOpen } from "lucide-react";

function useSignUpClientModel(returnTo: string) {

  const {
    user,
    isLoading: isAuthLoading,
    signUp,
    signIn,
    signOut,
    sendVerificationEmail,
    refreshAuthState,
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
    isLoading: false,
    verificationAction: null,
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
    error: null,
    verificationEmailSent: false,
    verificationStatus: null,
    }
  );
  const { isLoading, verificationAction, email, password, confirmPassword, role, error, verificationEmailSent, verificationStatus } = state as any;
  const assignIsLoading = (value: any) => dispatch({ isLoading: value });
  const assignVerificationAction = (value: any) => dispatch({ verificationAction: value });
  const assignEmail = (value: any) => dispatch({ email: value });
  const assignPassword = (value: any) => dispatch({ password: value });
  const assignConfirmPassword = (value: any) => dispatch({ confirmPassword: value });
  const assignRole = (value: any) => dispatch({ role: value });
  const assignError = (value: any) => dispatch({ error: value });
  const assignVerificationEmailSent = (value: any) => dispatch({ verificationEmailSent: value });
  const assignVerificationStatus = (value: any) => dispatch({ verificationStatus: value });

  const router = useRouter();

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      assignError("Passwords don't match");
      return;
    }

    try {
      assignIsLoading(true);
      assignError(null);
      assignVerificationStatus(null);
      await signUp(email, password, { role });
      assignVerificationEmailSent(true);
      assignVerificationStatus("Verification email sent. Check your inbox.");
    } catch (err) {
      assignError(
        err instanceof Error
          ? err.message
          : "Failed to create account. Please try again."
      );
    } finally {
      assignIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      assignVerificationAction("resend");
      assignError(null);
      assignVerificationStatus(null);
      await sendVerificationEmail();
      assignVerificationEmailSent(true);
      assignVerificationStatus("Verification email sent again.");
    } catch (err) {
      assignError(
        err instanceof Error
          ? err.message
          : "Failed to send verification email. Please try again."
      );
    } finally {
      assignVerificationAction(null);
    }
  };

  const handleRefreshVerification = async () => {
    try {
      assignVerificationAction("refresh");
      assignError(null);
      assignVerificationStatus(null);
      await refreshAuthState();
      assignVerificationStatus("Email status refreshed.");
    } catch (err) {
      assignError(
        err instanceof Error
          ? err.message
          : "Could not refresh your email status. Please try again."
      );
    } finally {
      assignVerificationAction(null);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      assignIsLoading(true);
      assignError(null);
      await signIn("google");
      router.push(returnTo);
    } catch (err) {
      assignError(
        err instanceof Error
          ? err.message
          : "Failed to sign in with Google. Please try again."
      );
    } finally {
      assignIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      assignIsLoading(true);
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
      assignIsLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <AuthLayout
        title="Checking your session"
        alternateLink={{
          text: "Already have an account?",
          linkText: "Sign in",
          href: "/auth/signin",
        }}
      >
        <div className="flex justify-center py-6">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </AuthLayout>
    );
  }

  if (user?.isPasswordUser && !user.emailVerified) {
    return (
      <AuthLayout
        title="Verify your email"
        alternateLink={{
          text: "Need a different account?",
          linkText: "Sign in",
          href: "/auth/signin",
        }}
      >
        {error && <AuthAlert type="error" message={error} />}
        {(verificationEmailSent || verificationStatus) && (
          <AuthAlert
            type="success"
            message={
              verificationStatus ??
              "Verification email sent. Check your inbox."
            }
          />
        )}
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {user.email
              ? `We sent a verification link to ${user.email}.`
              : "We sent a verification link to your email address."}
          </p>
          <div className="grid gap-3">
            <Button
              type="button"
              onClick={handleResendVerification}
              disabled={verificationAction !== null}
              isLoading={verificationAction === "resend"}
              variant="outline"
              className="w-full"
              size="lg"
            >
              {verificationAction === "resend"
                ? "Sending..."
                : "Resend verification email"}
            </Button>
            <Button
              type="button"
              onClick={handleRefreshVerification}
              disabled={verificationAction !== null}
              isLoading={verificationAction === "refresh"}
              variant="secondary"
              className="w-full"
              size="lg"
            >
              {verificationAction === "refresh"
                ? "Checking..."
                : "I've verified my email"}
            </Button>
            <Button
              type="button"
              onClick={() => router.push(returnTo)}
              disabled={verificationAction !== null}
              className="w-full"
              size="lg"
            >
              Continue
            </Button>
          </div>
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
          linkText: "Sign in",
          href: "/auth/signin",
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
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            Continue
          </Button>
          <Button
            onClick={handleSignOut}
            disabled={isLoading}
            isLoading={isLoading}
            variant="secondary"
            className="w-full"
            size="lg"
          >
            {isLoading ? "Signing out..." : "Sign out"}
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      alternateLink={{
        text: "Already have an account?",
        linkText: "Sign in",
        href: "/auth/signin",
      }}
      footer={
        <p className="text-center text-xs text-muted-foreground">
          By signing up, you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-4 hover:opacity-90">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-4 hover:opacity-90">
            Privacy Policy
          </Link>
          .
        </p>
      }
    >
      {error && <AuthAlert type="error" message={error} />}

      <div className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="lbl-SignUpClient-310" className="block text-sm font-medium text-foreground">
            I am a...
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => assignRole("student")}
              disabled={isLoading}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                role === "student"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <BookOpen
                className={`h-6 w-6 ${
                  role === "student" ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  role === "student" ? "text-primary" : "text-foreground"
                }`}
              >
                Student
              </span>
            </button>
            <button
              type="button"
              onClick={() => assignRole("teacher")}
              disabled={isLoading}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                role === "teacher"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <GraduationCap
                className={`h-6 w-6 ${
                  role === "teacher" ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  role === "teacher" ? "text-primary" : "text-foreground"
                }`}
              >
                Teacher
              </span>
            </button>
          </div>
        </div>

        <AuthInput
          id="email"
          name="email"
          type="email"
          label="Email address"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => assignEmail(e.target.value)}
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
          onChange={(e) => assignPassword(e.target.value)}
          disabled={isLoading}
          placeholder="••••••••"
        />

        <AuthInput
          id="confirm-password"
          name="confirm-password"
          type="password"
          label="Confirm Password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => assignConfirmPassword(e.target.value)}
          disabled={isLoading}
          placeholder="••••••••"
        />

        <div className="space-y-3">
          <Button
            onClick={handleSignUp}
            disabled={isLoading || !email || !password || !confirmPassword}
            isLoading={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? "Creating account..." : "Create account"}
          </Button>

          <AuthDivider />

          <GoogleSignInButton
            onClick={handleGoogleSignIn}
            isLoading={isLoading}
            disabled={isLoading}
          />
        </div>
      </div>
    </AuthLayout>
  );
}

export default function SignUpClient({
  returnToParam,
}: {
  returnToParam?: string;
}) {
  const returnTo = safeReturnTo(returnToParam, "/");
  return useSignUpClientModel(returnTo);
}

