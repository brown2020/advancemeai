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
import type { UserRole } from "@/types/user-profile";
import { GraduationCap, BookOpen } from "lucide-react";

export default function SignUpClient() {
  const { user, isLoading: authLoading, signUp, signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/";

  // Redirect if already logged in (only after auth state is determined)
  useEffect(() => {
    if (!authLoading && user) {
      router.push(returnTo);
    }
  }, [user, authLoading, router, returnTo]);

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await signUp(email, password, { role });
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
        {/* Role Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            I am a...
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("student")}
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
              onClick={() => setRole("teacher")}
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
