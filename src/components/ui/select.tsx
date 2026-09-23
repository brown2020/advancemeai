import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utils/cn";
import { fieldBaseClass } from "./field-styles";

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  size?: "sm" | "default";
};

/** Styled native select: accessible and mobile-friendly by default. */
const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, size = "default", children, ...props }, ref) => (
    <div className={cn("relative", className)}>
      <select
        ref={ref}
        className={cn(
          fieldBaseClass,
          "appearance-none border-input pl-3.5 pr-9 text-sm",
          size === "sm" ? "h-9 rounded-lg" : "h-11"
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
    </div>
  )
);
Select.displayName = "Select";

export { Select };
