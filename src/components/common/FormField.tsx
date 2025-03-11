"use client";

import { forwardRef, HTMLAttributes } from "react";
import { cn } from "@/utils/classNames";

export interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  htmlFor?: string;
  error?: string;
  description?: string;
  required?: boolean;
}

const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
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
  ) => {
    return (
      <div ref={ref} className={cn("mb-4", className)} {...props}>
        {label && (
          <label htmlFor={htmlFor} className="block text-sm font-medium mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        {children}
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

FormField.displayName = "FormField";

export { FormField };
