import { Check } from "lucide-react";
import { cn } from "@/utils/cn";

type ChecklistItemProps = {
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  trailing?: React.ReactNode;
};

/** Toggle row used in the folder popovers (checkbox look, 40px tap target). */
export function ChecklistItem({
  checked,
  disabled,
  onToggle,
  children,
  trailing,
}: ChecklistItemProps) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      disabled={disabled}
      onClick={onToggle}
      className="flex min-h-10 w-full items-center gap-2 rounded-lg px-2 text-left text-sm hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
    >
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-md border",
          checked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-input"
        )}
        aria-hidden
      >
        {checked && <Check className="size-3.5" />}
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {trailing && (
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {trailing}
        </span>
      )}
    </button>
  );
}
