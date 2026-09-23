"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/utils/cn";
import { fieldBaseClass, fieldErrorClass } from "./field-styles";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <div className="w-full">
      <textarea
        className={cn(
          fieldBaseClass,
          "min-h-24 px-3.5 py-2.5 text-sm leading-relaxed",
          error ? fieldErrorClass : "border-input",
          className
        )}
        aria-invalid={error ? true : undefined}
        ref={ref}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
    </div>
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
