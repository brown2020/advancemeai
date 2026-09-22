"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  AuthLayout,
  AuthAlert,
  AuthInput,
} from "@/components/auth/AuthLayout";

export default function ForgotPasswordClient() {
  const { sendPasswordReset } = useAuth();
  const [email, assignEmail] = useState("");
  const [isLoading, assignIsLoading] = useState(false);
  const [error, assignError] = useState<string | null>(null);
  const [sent, assignSent] = useState(false);
  const trimmedEmail = email.trim();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const preset = params.get("email");
    if (preset) assignEmail(preset);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    assignError(null);
    assignSent(false);
    if (!trimmedEmail) {
      assignError("Please enter your email address");
      return;
    }
    try {
      assignIsLoading(true);
      await sendPasswordReset(trimmedEmail);
      assignSent(true);
    } catch (err) {
      assignError(
        err instanceof Error
          ? err.message
          : "Failed to send reset email. Please try again."
      );
    } finally {
      assignIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="Enter your email and we will send a reset link if an account exists."
    >
      {error && <AuthAlert type="error" message={error} />}
      {sent && (
        <AuthAlert
          type="success"
          message="If an account uses that email, a password reset link will arrive shortly."
        />
      )}
      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthInput
          id="email"
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => assignEmail(e.target.value)}
          disabled={isLoading}
          required
        />
        <Button type="submit" className="w-full" disabled={isLoading || !trimmedEmail}>
          {isLoading ? "Sending..." : "Send reset link"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link href="/auth/signin" className="font-medium text-primary underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
