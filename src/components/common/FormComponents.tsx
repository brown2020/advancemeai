"use client";

import React, { forwardRef, HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  htmlFor?: string;
  error?: string;
  description?: string;
  required?: boolean;
}

/**
 * Form field wrapper with label, description, and error message
 */
export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  (
    {
      className,
      label,
      htmlFor,
      error,
      description,
      required,
      children,
      ...props
    },
    ref
  ) => (
    <div ref={ref} className={cn("mb-4", className)} {...props}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  )
);
FormField.displayName = "FormField";

/**
 * Text input component
 */
export const TextInput = React.memo(
  React.forwardRef<
    HTMLInputElement,
    React.InputHTMLAttributes<HTMLInputElement> & {
      error?: string;
    }
  >(({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full px-3 py-2 border rounded-lg bg-background text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        error ? "border-destructive focus-visible:ring-destructive" : "border-input",
        className
      )}
      {...props}
    />
  ))
);
TextInput.displayName = "TextInput";

/**
 * Textarea component
 */
export const TextArea = React.memo(
  React.forwardRef<
    HTMLTextAreaElement,
    React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
      error?: string;
    }
  >(({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full px-3 py-2 border rounded-lg bg-background text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        error ? "border-destructive focus-visible:ring-destructive" : "border-input",
        className
      )}
      {...props}
    />
  ))
);
TextArea.displayName = "TextArea";

/**
 * Checkbox component
 */
export const Checkbox = React.memo(
  React.forwardRef<
    HTMLInputElement,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
      label: string;
    }
  >(({ className, label, ...props }, ref) => (
    <label className="flex items-center space-x-2">
      <input
        ref={ref}
        type="checkbox"
        className={cn("rounded text-primary", className)}
        {...props}
      />
      <span>{label}</span>
    </label>
  ))
);
Checkbox.displayName = "Checkbox";

/**
 * Form actions container
 */
export const FormActions = React.memo(
  ({
    children,
    align = "right",
    className,
  }: {
    children: React.ReactNode;
    align?: "left" | "center" | "right";
    className?: string;
  }) => {
    const alignClasses = {
      left: "justify-start",
      center: "justify-center",
      right: "justify-end",
    };

    return (
      <div
        className={cn("flex mt-6 space-x-2", alignClasses[align], className)}
      >
        {children}
      </div>
    );
  }
);
FormActions.displayName = "FormActions";

/**
 * Form section with title
 */
export const FormSection = React.memo(
  ({
    title,
    description,
    children,
    className,
  }: {
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <div
      className={cn(
        "bg-card text-card-foreground rounded-xl border border-border shadow-sm p-6 mb-6",
        className
      )}
    >
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      {description && (
        <p className="text-muted-foreground mb-4">{description}</p>
      )}
      {children}
    </div>
  )
);
FormSection.displayName = "FormSection";
