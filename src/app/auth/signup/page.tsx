"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import {
  AuthLayout,
  AuthAlert,
  AuthInput,
  AuthDivider,
} from "@/components/auth/AuthLayout";

export default function SignUpPage() {
  const { user, signUp, signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/";

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push(returnTo);
    }
  }, [user, router, returnTo]);

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await signUp(email, password);
      router.push(returnTo);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create account. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signIn("google");
      router.push(returnTo);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to sign in with Google. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

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
          <a href="#" className="underline underline-offset-4 hover:opacity-90">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="underline underline-offset-4 hover:opacity-90">
            Privacy Policy
          </a>
          .
        </p>
      }
    >
      {error && <AuthAlert type="error" message={error} />}

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
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
          onChange={(e) => setConfirmPassword(e.target.value)}
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
