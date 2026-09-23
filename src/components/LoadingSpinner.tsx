import { Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  className?: string;
}

const sizeClasses = {
  small: "size-5",
  medium: "size-8",
  large: "size-10",
} as const;

export function LoadingSpinner({ size = "medium", className }: LoadingSpinnerProps) {
  return (
    <div className="flex justify-center py-4">
      <Loader2
        className={cn("animate-spin text-primary", sizeClasses[size], className)}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
