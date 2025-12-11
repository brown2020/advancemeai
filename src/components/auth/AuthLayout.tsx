"use client";

import Image from "next/image";
import Link from "next/link";

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
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8">
        <AuthHeader
          title={title}
          subtitle={subtitle}
          alternateLink={alternateLink}
        />
        <div className="bg-white dark:bg-gray-800 px-6 py-8 shadow-md rounded-xl">
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
      <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
        {title}
      </h2>
      {(subtitle || alternateLink) && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {subtitle}{" "}
          {alternateLink && (
            <Link
              href={alternateLink.href}
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
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
  const styles = {
    error: "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300",
    success:
      "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300",
  };

  return <div className={`${styles[type]} p-3 rounded-lg mb-4`}>{message}</div>;
}

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

/**
 * Styled input for auth forms
 */
export function AuthInput({ label, id, ...props }: AuthInputProps) {
  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
      </label>
      <input
        id={id}
        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
        {...props}
      />
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
        <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
          {text}
        </span>
      </div>
    </div>
  );
}
