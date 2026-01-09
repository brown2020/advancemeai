"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import {
  AuthLayout,
  AuthAlert,
  AuthInput,
  AuthDivider,
} from "@/components/auth/AuthLayout";

export default function SignInClient() {
  const { user, signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/";

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push(returnTo);
    }
  }, [user, router, returnTo]);

  const handleLogin = async (method: "google" | "password") => {
    try {
      setIsLoading(true);
      setError(null);
      if (method === "password") {
        await signIn("password", { email, password });
      } else {
        await signIn("google");
      }
      router.push(returnTo);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to sign in. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      if (!email) {
        setError("Please enter your email address");
        return;
      }
      setIsLoading(true);
      await signIn("resetPassword", { email });
      setResetEmailSent(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send reset email. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

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
          disabled={isLoading}
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
          disabled={isLoading}
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
            disabled={isLoading}
            className="text-sm font-medium text-primary hover:opacity-90"
          >
            Forgot password?
          </button>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => handleLogin("password")}
            disabled={isLoading || !email || !password}
            isLoading={isLoading && email.length > 0 && password.length > 0}
            className="w-full"
            size="lg"
          >
            {isLoading && email.length > 0 && password.length > 0
              ? "Signing in..."
              : "Sign in"}
          </Button>

          <AuthDivider />

          <GoogleSignInButton
            onClick={() => handleLogin("google")}
            isLoading={isLoading && email.length === 0}
            disabled={isLoading}
          />
        </div>
      </div>
    </AuthLayout>
  );
}

