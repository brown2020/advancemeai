"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  AuthLayout,
  AuthAlert,
  AuthInput,
} from "@/components/auth/AuthLayout";

export default function ForgotPasswordClient() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const trimmedEmail = email.trim();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const preset = params.get("email");
    if (preset) setEmail(preset);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSent(false);
    if (!trimmedEmail) {
      setError("Please enter your email address");
      return;
    }
    try {
      setIsLoading(true);
      await sendPasswordReset(trimmedEmail);
      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send reset email. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send a reset link if an account exists."
    >
      {error && <AuthAlert type="error" message={error} />}
      {sent && (
        <AuthAlert
          type="success"
          message="If an account uses that email, a password reset link will arrive shortly."
        />
      )}
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <AuthInput
          id="email"
          name="email"
          type="email"
          label="Email address"
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          required
        />
        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={isLoading || !trimmedEmail}
          isLoading={isLoading}
        >
          {isLoading ? "Sending..." : "Send reset link"}
        </Button>
      </form>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link
          href="/auth/signin"
          className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to sign in
        </Link>
        <Link
          href="/auth/signup"
          className="font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Create an account
        </Link>
      </div>
    </AuthLayout>
  );
}
