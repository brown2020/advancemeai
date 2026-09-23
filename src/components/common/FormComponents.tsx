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

export { Input as TextInput } from "@/components/ui/input";
export { Textarea as TextArea } from "@/components/ui/textarea";

export function FormActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mt-6 flex flex-wrap justify-end gap-2", className)}>
      {children}
    </div>
  );
}

export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "mb-6 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-card sm:p-6",
        className
      )}
    >
      <h2 className="mb-1 text-lg font-semibold">{title}</h2>
      {description && (
        <p className="mb-4 text-sm text-muted-foreground">{description}</p>
      )}
      {children}
    </section>
  );
}
