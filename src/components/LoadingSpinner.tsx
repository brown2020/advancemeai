import { cn } from "@/utils/cn";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  variant?: "primary" | "secondary" | "white";
  className?: string;
}

const sizeClasses = {
  small: "h-6 w-6",
  medium: "h-12 w-12",
  large: "h-16 w-16",
} as const;

const variantClasses = {
  primary: "border-primary",
  secondary: "border-muted-foreground",
  white: "border-background",
} as const;

export function LoadingSpinner({
  size = "medium",
  variant = "primary",
  className,
}: LoadingSpinnerProps) {
  return (
    <div className="flex justify-center py-4">
      <div
        className={cn(
          "animate-spin rounded-full border-t-2 border-b-2",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
