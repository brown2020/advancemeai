"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ROUTES } from "@/constants/appConstants";
import { cn } from "@/utils/cn";
import { formatTimer } from "./PracticeComponents";

type TestTopBarProps = {
  title: string;
  /** Small label above the title, e.g. "Section 1 of 2". */
  eyebrow?: string;
  /** 1-based question number. */
  current?: number;
  total?: number;
  remainingSeconds?: number | null;
  /** Extra controls rendered beside the timer (e.g. bookmark). */
  actions?: React.ReactNode;
  exitHref?: string;
  /** Ask before leaving, because progress would be lost. */
  confirmExit?: boolean;
};

/** Slim, sticky test-taking header: section, question position, timer, exit. */
export function TestTopBar({
  title,
  eyebrow,
  current,
  total,
  remainingSeconds = null,
  actions,
  exitHref = ROUTES.PRACTICE.INDEX,
  confirmExit = false,
}: TestTopBarProps) {
  const router = useRouter();
  const [isExitOpen, setIsExitOpen] = useState(false);
  const timer = formatTimer(remainingSeconds);
  const isLowTime = remainingSeconds !== null && remainingSeconds <= 60;

  return (
    <div className="sticky top-16 z-30 border-b border-border bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {eyebrow}
            </p>
          )}
          <p className="truncate text-sm font-semibold sm:text-base">{title}</p>
        </div>

        {current !== undefined && total !== undefined && total > 0 && (
          <p className="hidden text-sm font-medium tabular-nums text-muted-foreground sm:block">
            Question {current} of {total}
          </p>
        )}

        {timer && (
          <div
            role="timer"
            aria-label={`Time remaining ${timer}`}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold tabular-nums",
              isLowTime
                ? "bg-destructive/10 text-destructive"
                : "bg-secondary text-foreground"
            )}
          >
            <Clock className="size-4" aria-hidden />
            {timer}
          </div>
        )}

        {actions}

        {confirmExit ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Exit test"
            onClick={() => setIsExitOpen(true)}
          >
            <X className="size-5" />
          </Button>
        ) : (
          <Link
            href={exitHref}
            aria-label="Exit practice"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <X className="size-5" />
          </Link>
        )}
      </div>

      {current !== undefined && total !== undefined && total > 0 && (
        <p className="border-t border-border px-4 py-1.5 text-center text-xs font-medium tabular-nums text-muted-foreground sm:hidden">
          Question {current} of {total}
        </p>
      )}

      {confirmExit && (
        <Dialog open={isExitOpen} onOpenChange={setIsExitOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Leave this test?</DialogTitle>
              <DialogDescription>
                Your answers in the current section won&apos;t be saved.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setIsExitOpen(false)}>
                Keep going
              </Button>
              <Button variant="destructive" onClick={() => router.push(exitHref)}>
                Exit test
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
