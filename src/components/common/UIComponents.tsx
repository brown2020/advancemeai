import React from "react";
import Link from "next/link";
import { cn } from "@/utils/cn";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button-variants";

/**
 * Common page container with consistent padding and max width
 */
export const PageContainer = React.memo(
  ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={cn("container mx-auto px-4 py-8", className)}>
      {children}
    </div>
  )
);
PageContainer.displayName = "PageContainer";

/**
 * Common page header with title and optional actions
 */
export const PageHeader = React.memo(
  ({
    title,
    actions,
    className,
  }: {
    title: string;
    actions?: React.ReactNode;
    className?: string;
  }) => (
    <div className={cn("flex justify-between items-center mb-6", className)}>
      <h1 className="text-2xl font-bold">{title}</h1>
      {actions && <div className="flex space-x-2">{actions}</div>}
    </div>
  )
);
PageHeader.displayName = "PageHeader";

/**
 * Common loading state component
 */
export const LoadingState = React.memo(
  ({ message = "Loading..." }: { message?: string }) => (
    <div className="flex flex-col items-center justify-center py-12">
      <LoadingSpinner size="large" />
      {message && <p className="mt-4 text-muted-foreground">{message}</p>}
    </div>
  )
);
LoadingState.displayName = "LoadingState";

/**
 * Common error display component
 */
export const ErrorDisplay = React.memo(({ message }: { message: string }) => (
  <Alert variant="destructive" className="mb-4">
    <AlertDescription>{message}</AlertDescription>
  </Alert>
));
ErrorDisplay.displayName = "ErrorDisplay";

/**
 * Common empty state component
 */
export const EmptyState = React.memo(
  ({
    title,
    message,
    actionLink,
    actionText,
  }: {
    title: string;
    message: string;
    actionLink?: string;
    actionText?: string;
  }) => (
    <div className="text-center py-12">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="mb-6 text-muted-foreground">{message}</p>
      {actionLink && actionText && (
        <Link
          href={actionLink}
          className={buttonVariants({ size: "default" })}
        >
          {actionText}
        </Link>
      )}
    </div>
  )
);
EmptyState.displayName = "EmptyState";

/**
 * Grid column class mappings for Tailwind JIT compilation
 * Using static classes to ensure proper compilation
 */
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

/**
 * Common grid layout for cards
 */
export const CardGrid = React.memo(
  ({
    children,
    columns = { default: 1, md: 2, lg: 3 },
    className,
  }: {
    children: React.ReactNode;
    columns?: { default: GridColCount; md?: GridColCount; lg?: GridColCount };
    className?: string;
  }) => {
    const defaultCols = GRID_COLS[columns.default];
    const mdCols = columns.md ? MD_GRID_COLS[columns.md] : "";
    const lgCols = columns.lg ? LG_GRID_COLS[columns.lg] : "";

    return (
      <div className={cn("grid gap-6", defaultCols, mdCols, lgCols, className)}>
        {children}
      </div>
    );
  }
);
CardGrid.displayName = "CardGrid";

/**
 * Common action button with link
 */
export const ActionLink = React.memo(
  ({
    href,
    children,
    variant = "primary",
    className,
  }: {
    href: string;
    children: React.ReactNode;
    variant?: "primary" | "secondary";
    className?: string;
  }) => {
    const buttonVariant = variant === "primary" ? "default" : "secondary";

    return (
      <Link
        href={href}
        className={cn(
          buttonVariants({ variant: buttonVariant }),
          className
        )}
      >
        {children}
      </Link>
    );
  }
);
ActionLink.displayName = "ActionLink";

/**
 * Common section container with consistent styling
 */
export const SectionContainer = React.memo(
  ({
    children,
    title,
    className,
  }: {
    children: React.ReactNode;
    title?: string;
    className?: string;
  }) => (
    <div
      className={cn(
        "bg-card text-card-foreground rounded-xl border border-border shadow-sm p-6 mb-6",
        className
      )}
    >
      {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
      {children}
    </div>
  )
);
SectionContainer.displayName = "SectionContainer";
