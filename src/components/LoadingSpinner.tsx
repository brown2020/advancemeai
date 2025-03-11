interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  color?: string;
}

export function LoadingSpinner({
  size = "medium",
  color = "blue-500",
}: LoadingSpinnerProps) {
  const sizeClass = {
    small: "h-6 w-6",
    medium: "h-12 w-12",
    large: "h-16 w-16",
  }[size];

  return (
    <div className="flex justify-center py-4">
      <div
        className={`animate-spin rounded-full border-t-2 border-b-2 border-${color} ${sizeClass}`}
      ></div>
    </div>
  );
}
