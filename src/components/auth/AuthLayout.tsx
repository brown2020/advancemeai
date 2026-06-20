"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils/cn";
interface AuthLayoutProps {
  /** Page title */
  title: string;
  /** Subtitle text */
  subtitle?: string;
  /** Link to alternate auth page */
  alternateLink?: {
    text: string;
    linkText: string;
    href: string;
  };
  /** Form content */
  children: React.ReactNode;
  /** Optional footer content (e.g., terms of service) */
  footer?: React.ReactNode;
}

/**
 * Shared layout for authentication pages (sign-in, sign-up)
 */
export function AuthLayout({
  title,
  subtitle,
  alternateLink,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-muted/40 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <AuthHeader
          title={title}
          subtitle={subtitle}
          alternateLink={alternateLink}
        />
        <div className="rounded-xl border border-border bg-card px-6 py-8 shadow-sm">
          {children}
        </div>
        {footer}
      </div>
    </div>
  );
}

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  alternateLink?: {
    text: string;
    linkText: string;
    href: string;
  };
}

function AuthHeader({ title, subtitle, alternateLink }: AuthHeaderProps) {
  return (
    <div className="text-center">
      <Link href="/" className="inline-block">
        <Image
          src="/advance_icon.png"
          alt="Advance.me Logo"
          width={64}
          height={64}
          className="mx-auto"
          priority
        />
      </Link>
      <h2 className="mt-6 text-3xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {(subtitle || alternateLink) && (
        <p className="mt-2 text-sm text-muted-foreground">
          {subtitle ?? alternateLink?.text}{" "}
          {alternateLink && (
            <Link
              href={alternateLink.href}
              className="font-medium text-primary hover:opacity-90"
            >
              {alternateLink.linkText}
            </Link>
          )}
        </p>
      )}
    </div>
  );
}

interface AuthAlertProps {
  type: "error" | "success";
  message: string;
}

/**
 * Alert component for auth pages
 */
export function AuthAlert({ type, message }: AuthAlertProps) {
  if (type === "error") {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="mb-4 border-primary/25 bg-primary/10">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

/**
 * Styled input for auth forms
 */
export function AuthInput({
  label,
  id,
  type,
  className,
  disabled,
  ...props
}: AuthInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && isPasswordVisible ? "text" : type;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={inputType}
          className={cn(isPassword && "pr-10", className)}
          disabled={disabled}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            aria-pressed={isPasswordVisible}
            onClick={() => setIsPasswordVisible((value) => !value)}
            disabled={disabled}
            className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPasswordVisible ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

interface AuthDividerProps {
  text?: string;
}

/**
 * Divider with optional text for auth forms
 */
export function AuthDivider({ text = "Or continue with" }: AuthDividerProps) {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border"></div>
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="bg-card px-2 text-muted-foreground">
          {text}
        </span>
      </div>
    </div>
  );
}
