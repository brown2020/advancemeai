"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type TestBottomBarProps = {
  onBack?: () => void;
  onNext?: () => void;
  canGoBack?: boolean;
  canGoNext?: boolean;
  /** Short status text in the middle, e.g. "3 of 5 answered". */
  status?: React.ReactNode;
  /** Primary actions (Check answer / Submit) on the right. */
  children?: React.ReactNode;
};

/** Sticky bottom navigation for question screens. */
export function TestBottomBar({
  onBack,
  onNext,
  canGoBack = false,
  canGoNext = false,
  status,
  children,
}: TestBottomBarProps) {
  return (
    <div className="sticky bottom-0 z-30 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          {onBack && (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={!canGoBack}
            >
              <ChevronLeft aria-hidden />
              Back
            </Button>
          )}
          {onNext && (
            <Button
              type="button"
              variant="outline"
              onClick={onNext}
              disabled={!canGoNext}
            >
              Next
              <ChevronRight aria-hidden />
            </Button>
          )}
        </div>

        {status && (
          <div className="hidden min-w-0 flex-1 text-center text-sm tabular-nums text-muted-foreground md:block">
            {status}
          </div>
        )}

        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          {children}
        </div>
      </div>
    </div>
  );
}
