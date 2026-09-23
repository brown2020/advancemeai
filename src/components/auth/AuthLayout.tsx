"use client";

import { useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Layers,
  type LucideIcon,
  TrendingUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/common/FormComponents";
import { fieldErrorClass } from "@/components/ui/field-styles";
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
 * Shared split layout for authentication pages: brand panel on the left
 * (desktop only), form on the right. Single column on mobile.
 */
export function AuthLayout({
  title,
  subtitle,
  alternateLink,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-6xl items-center px-4 py-8 sm:px-6 md:py-12">
      <div className="grid w-full overflow-hidden rounded-3xl border border-border bg-card shadow-card lg:grid-cols-2">
        <AuthBrandPanel />
        <div className="flex flex-col justify-center px-5 py-8 sm:px-10 sm:py-12 lg:px-14">
          <div className="mx-auto w-full max-w-sm animate-fade-in">
            <AuthHeader
              title={title}
              subtitle={subtitle}
              alternateLink={alternateLink}
            />
            {children}
            {footer && <div className="mt-6">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

const VALUE_POINTS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Layers,
    title: "Flashcards that stick",
    text: "Create sets, then study with Cards, Learn, Write, Match, and Test.",
  },
  {
    icon: GraduationCap,
    title: "SAT prep that adapts",
    text: "Practice by section or take a full test, with explanations for every miss.",
  },
  {
    icon: TrendingUp,
    title: "Progress you can see",
    text: "Earn XP, keep your streak alive, and watch your mastery grow.",
  },
];

function AuthBrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
      {/* CSS-only dot grid + soft glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,var(--primary-foreground)_1px,transparent_1.5px)] bg-size-[22px_22px] opacity-[0.12]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-primary-foreground/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full border-[40px] border-primary-foreground/5"
      />

      <Link
        href="/"
        className="relative flex items-center gap-2.5 text-lg font-bold tracking-tight"
      >
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary-foreground/95 shadow-card">
          <Image
            src="/advance_icon.png"
            alt=""
            width={28}
            height={28}
            priority
          />
        </span>
        Advance.me
      </Link>

      <div className="relative">
        <h2 className="text-3xl font-bold leading-tight tracking-tight xl:text-4xl">
          Study smarter.
          <br />
          Score higher.
        </h2>
        <p className="mt-3 max-w-sm text-primary-foreground/80">
          Flashcards and SAT prep in one calm, focused place.
        </p>
        <ul className="mt-8 space-y-5">
          {VALUE_POINTS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-primary-foreground/75">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative flex items-center gap-2 text-sm text-primary-foreground/70">
        <BookOpen className="size-4" aria-hidden />
        Free for students and teachers.
      </p>
    </aside>
  );
}

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  alternateLink?: AuthLayoutProps["alternateLink"];
}

function AuthHeader({ title, subtitle, alternateLink }: AuthHeaderProps) {
  return (
    <div className="mb-8">
      <Link href="/" className="mb-6 inline-block lg:hidden">
        <Image
          src="/advance_icon.png"
          alt="Advance.me home"
          width={44}
          height={44}
          priority
        />
      </Link>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      {(subtitle || alternateLink) && (
        <p className="mt-2 text-sm text-muted-foreground">
          {subtitle ?? alternateLink?.text}{" "}
          {alternateLink && (
            <Link
              href={alternateLink.href}
              className="font-semibold text-primary underline-offset-4 hover:underline"
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

/** Inline status banner for auth forms. */
export function AuthAlert({ type, message }: AuthAlertProps) {
  const isError = type === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;
  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={cn(
        "mb-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm animate-fade-in",
        isError
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-success/30 bg-success/10 text-foreground"
      )}
    >
      <Icon
        className={cn("mt-0.5 size-4 shrink-0", !isError && "text-success")}
        aria-hidden
      />
      <span>{message}</span>
    </div>
  );
}

interface AuthInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "id"> {
  id: string;
  label: string;
  /** Inline field error shown under the input. */
  error?: string;
  /** Optional trailing element in the label row (e.g. "Forgot password?"). */
  labelAction?: React.ReactNode;
}

/** Labeled input for auth forms, with a visibility toggle for passwords. */
export function AuthInput({
  label,
  id,
  type,
  className,
  disabled,
  error,
  labelAction,
  ...props
}: AuthInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const errorId = useId();
  const isPassword = type === "password";
  const inputType = isPassword && isPasswordVisible ? "text" : type;

  return (
    <FormField className="mb-0">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold">
          {label}
        </label>
        {labelAction}
      </div>
      <div className="relative">
        <Input
          id={id}
          type={inputType}
          className={cn(isPassword && "pr-11", error && fieldErrorClass, className)}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
            aria-pressed={isPasswordVisible}
            onClick={() => setIsPasswordVisible((value) => !value)}
            disabled={disabled}
            className="absolute right-1 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPasswordVisible ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Eye className="size-4" aria-hidden />
            )}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-destructive">
          {error}
        </p>
      )}
    </FormField>
  );
}

interface AuthDividerProps {
  text?: string;
}

/** Horizontal rule with centered label ("or"). */
export function AuthDivider({ text = "or" }: AuthDividerProps) {
  return (
    <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      {text}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

/** Centered spinner used while the auth state resolves. */
export function AuthSpinner() {
  return (
    <div className="flex justify-center py-6" aria-busy="true">
      <span className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
