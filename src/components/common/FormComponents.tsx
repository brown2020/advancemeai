import React from "react";
import { cn } from "@/utils/cn";

/**
 * Form field wrapper with label and error message
 */
export const FormField = React.memo(
  ({
    label,
    error,
    required,
    children,
    className,
  }: {
    label: string;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={cn("mb-4", className)}>
      <label className="block text-sm font-medium mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
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
        "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
        error ? "border-red-500" : "border-gray-300",
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
        "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500",
        error ? "border-red-500" : "border-gray-300",
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
        className={cn("rounded text-blue-600", className)}
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
        "bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6",
        className
      )}
    >
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      {description && <p className="text-gray-600 mb-4">{description}</p>}
      {children}
    </div>
  )
);
FormSection.displayName = "FormSection";
