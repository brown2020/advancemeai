"use client";

import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/utils/cn";
import { STUDY_MODES, getStudyModeMeta } from "./study-modes";
import { useStudySession } from "./StudySessionContext";

type StudyTopBarProps = {
  /** 0–100 */
  progress: number;
  /** Short counter such as "3 / 10". */
  progressLabel?: string;
  /** Extra controls on the right (settings, timer, ...). */
  actions?: React.ReactNode;
  className?: string;
};

/**
 * Slim header shared by every study mode: exit, mode switcher, progress.
 */
export function StudyTopBar({
  progress,
  progressLabel,
  actions,
  className,
}: StudyTopBarProps) {
  const session = useStudySession();
  const [menuOpen, setMenuOpen] = useState(false);
  const meta = getStudyModeMeta(session?.mode ?? "cards");
  const Icon = meta.icon;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card shadow-card",
        className
      )}
    >
      <div className="flex items-center gap-2 px-2 py-2 sm:px-3">
        {session ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={session.exit}
            aria-label="Back to set"
          >
            <X />
          </Button>
        ) : null}

        {session ? (
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex h-10 min-w-0 items-center gap-2 rounded-xl px-2 text-left font-semibold transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Study mode: ${meta.label}. Switch mode`}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="truncate">{meta.label}</span>
                <ChevronDown
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-60 p-1.5">
              <ul className="space-y-0.5" aria-label="Study modes">
                {STUDY_MODES.map(({ mode, label, icon: ModeIcon }) => {
                  const active = mode === session.mode;
                  return (
                    <li key={mode}>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          session.switchMode(mode);
                        }}
                        aria-current={active ? "true" : undefined}
                        className={cn(
                          "flex h-11 w-full items-center gap-3 rounded-lg px-2.5 text-sm font-medium transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          active
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-secondary"
                        )}
                      >
                        <ModeIcon className="size-4 text-primary" aria-hidden />
                        <span className="flex-1 text-left">{label}</span>
                        {active ? <Check className="size-4" aria-hidden /> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </PopoverContent>
          </Popover>
        ) : (
          <span className="px-2 font-semibold">{meta.label}</span>
        )}

        <div className="ml-auto flex items-center gap-1.5">
          {progressLabel ? (
            <span className="px-1 text-sm font-semibold tabular-nums text-muted-foreground">
              {progressLabel}
            </span>
          ) : null}
          {actions}
        </div>
      </div>
      <Progress
        value={progress}
        label={`${meta.label} progress`}
        className="h-1 rounded-none rounded-b-2xl bg-secondary/70"
        indicatorClassName="rounded-none"
      />
    </div>
  );
}
