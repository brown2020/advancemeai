import React from "react";
import Link from "next/link";
import { cn } from "@/utils/cn";
import { LoadingSpinner } from "@/components/LoadingSpinner";

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
      {message && <p className="mt-4 text-gray-600">{message}</p>}
    </div>
  )
);
LoadingState.displayName = "LoadingState";

/**
 * Common error display component
 */
export const ErrorDisplay = React.memo(({ message }: { message: string }) => (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
    {message}
  </div>
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
      <p className="mb-4">{message}</p>
      {actionLink && actionText && (
        <Link
          href={actionLink}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
        >
          {actionText}
        </Link>
      )}
    </div>
  )
);
EmptyState.displayName = "EmptyState";

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
    columns?: { default: number; md?: number; lg?: number };
    className?: string;
  }) => {
    const gridCols = `grid-cols-${columns.default} ${
      columns.md ? `md:grid-cols-${columns.md}` : ""
    } ${columns.lg ? `lg:grid-cols-${columns.lg}` : ""}`;

    return (
      <div className={cn(`grid gap-6 ${gridCols}`, className)}>{children}</div>
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
    const variantClasses = {
      primary: "bg-blue-600 text-white hover:bg-blue-700",
      secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    };

    return (
      <Link
        href={href}
        className={cn(
          "px-4 py-2 rounded-xl transition-colors",
          variantClasses[variant],
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
        "bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6",
        className
      )}
    >
      {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}
      {children}
    </div>
  )
);
SectionContainer.displayName = "SectionContainer";
