import { cn } from "@/utils/cn";

interface EditorActionBarProps {
  /** Short status text on the left (e.g. "12 cards ready"). */
  status?: React.ReactNode;
  /** Secondary actions (cancel, delete) shown before the primary action. */
  secondary?: React.ReactNode;
  /** The single primary submit button. */
  primary: React.ReactNode;
  className?: string;
}

/**
 * Action bar that sticks to the bottom of the viewport while scrolling a long
 * card list. Sits above the mobile tab bar on small screens.
 */
export function EditorActionBar({ status, secondary, primary, className }: EditorActionBarProps) {
  return (
    <div
      className={cn(
        "sticky z-30 mt-8 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:bottom-4",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card/95 p-2.5 shadow-lift backdrop-blur-md sm:gap-3 sm:p-3">
        {status && (
          <p className="hidden min-w-0 flex-1 truncate pl-2 text-sm text-muted-foreground sm:block" aria-live="polite">
            {status}
          </p>
        )}
        <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
          {secondary}
          {primary}
        </div>
      </div>
    </div>
  );
}
