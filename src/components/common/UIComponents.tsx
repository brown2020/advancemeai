import React from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { cn } from "@/utils/cn";
import { LoadingSpinner } from "@/components/ui/spinner";
import { buttonVariants } from "@/components/ui/button-variants";

/** Page wrapper: consistent gutters, max width and vertical rhythm. */
export function PageContainer({
  children,
  className,
  width = "default",
}: {
  children: React.ReactNode;
  className?: string;
  width?: "narrow" | "default" | "wide";
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 py-8 sm:px-6 md:py-10",
        width === "narrow" && "max-w-3xl",
        width === "default" && "max-w-6xl",
        width === "wide" && "max-w-7xl",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Page title block with optional eyebrow, description and actions. */
export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** Section title row with optional trailing action (e.g. "View all"). */
export function SectionHeading({
  title,
  icon,
  action,
  className,
}: {
  title: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-center justify-between gap-4", className)}>
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        {icon && <span className="text-muted-foreground [&_svg]:size-5">{icon}</span>}
        {title}
      </h2>
      {action}
    </div>
  );
}

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16" aria-busy="true">
      <LoadingSpinner size="large" />
      {message && <p className="mt-2 text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}

export function ErrorDisplay({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "mb-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive",
        className
      )}
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}

export function EmptyState({
  title,
  message,
  icon,
  actionLink,
  actionText,
  action,
  className,
}: {
  title: string;
  message: React.ReactNode;
  icon?: React.ReactNode;
  actionLink?: string;
  actionText?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-accent text-primary [&_svg]:size-6">
          {icon}
        </div>
      )}
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1.5 max-w-md text-sm text-muted-foreground">{message}</p>
      {(action || (actionLink && actionText)) && (
        <div className="mt-6">
          {action ?? (
            <Link href={actionLink!} className={buttonVariants()}>
              {actionText}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

const GRID_COLS = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
} as const;

const MD_GRID_COLS = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
} as const;

const LG_GRID_COLS = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
} as const;

type GridColCount = 1 | 2 | 3 | 4;

export function CardGrid({
  children,
  columns = { default: 1, md: 2, lg: 3 },
  className,
}: {
  children: React.ReactNode;
  columns?: { default: GridColCount; md?: GridColCount; lg?: GridColCount };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-4",
        GRID_COLS[columns.default],
        columns.md && MD_GRID_COLS[columns.md],
        columns.lg && LG_GRID_COLS[columns.lg],
        className
      )}
    >
      {children}
    </div>
  );
}

export function ActionLink({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: variant === "primary" ? "default" : "outline" }),
        className
      )}
    >
      {children}
    </Link>
  );
}

/** Bordered surface for a group of related content. */
export function SectionContainer({
  children,
  title,
  description,
  className,
}: {
  children: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "mb-6 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-card sm:p-6",
        className
      )}
    >
      {title && <h2 className="text-lg font-semibold">{title}</h2>}
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
      {(title || description) && <div className="mb-4" />}
      {children}
    </section>
  );
}
