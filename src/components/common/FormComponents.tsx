import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  htmlFor?: string;
  error?: string;
  description?: string;
  required?: boolean;
}

/** Label, hint and error wrapper around a single form control. */
export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  (
    { className, label, htmlFor, error, description, required, children, ...props },
    ref
  ) => (
    <div ref={ref} className={cn("mb-5", className)} {...props}>
      {label && (
        <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold">
          {label}
          {required && <span className="ml-1 text-destructive">*</span>}
        </label>
      )}
      {children}
      {description && (
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
      )}
      {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
    </div>
  )
);
FormField.displayName = "FormField";
