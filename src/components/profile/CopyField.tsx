"use client";

import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CopyFieldProps {
  label: string;
  value: string | null | undefined;
  /** What to copy when it differs from the displayed value. */
  getCopyValue?: () => string;
  onCopy: (value: string) => void;
}

/** Read-only value with a copy button (email, user ID, profile link). */
export function CopyField({ label, value, getCopyValue, onCopy }: CopyFieldProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value || "—"}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => value && onCopy(getCopyValue ? getCopyValue() : value)}
        disabled={!value}
        aria-label={`Copy ${label.toLowerCase()}`}
      >
        <Copy aria-hidden />
      </Button>
    </div>
  );
}
