"use client";

import { useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { logger } from "@/utils/logger";

interface InviteLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteCode: string;
  groupName: string;
  /** "class" or "study group"; used in helper copy. */
  noun?: string;
  onRegenerateCode?: () => Promise<string>;
}

/** Dialog showing the join code and shareable invite link. */
export function InviteLinkModal({
  isOpen,
  onClose,
  inviteCode,
  groupName,
  noun = "group",
  onRegenerateCode,
}: InviteLinkModalProps) {
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [overrideCode, setOverrideCode] = useState<string | null>(null);
  const currentCode = overrideCode ?? inviteCode;

  const inviteLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/groups/join?code=${currentCode}`
      : `/groups/join?code=${currentCode}`;

  const copy = async (value: string, which: "link" | "code") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      logger.error("Failed to copy:", error);
    }
  };

  const handleRegenerate = async () => {
    if (!onRegenerateCode) return;
    setIsRegenerating(true);
    try {
      const newCode = await onRegenerateCode();
      setOverrideCode(newCode);
    } catch (error) {
      logger.error("Failed to regenerate code:", error);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite to {groupName}</DialogTitle>
          <DialogDescription>
            Students can join with the code or by opening the link.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl bg-accent px-4 py-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-foreground">
            Join code
          </p>
          <p className="mt-1 break-all font-mono text-4xl font-bold tracking-[0.2em] text-primary">
            {currentCode}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copy(currentCode, "code")}
            >
              {copied === "code" ? <Check aria-hidden /> : <Copy aria-hidden />}
              {copied === "code" ? "Copied" : "Copy code"}
            </Button>
            {onRegenerateCode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRegenerate}
                disabled={isRegenerating}
              >
                <RefreshCw className={isRegenerating ? "animate-spin" : undefined} aria-hidden />
                New code
              </Button>
            )}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-semibold">Invite link</p>
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1 truncate rounded-xl border border-input bg-secondary px-3 py-2.5 font-mono text-xs">
              {inviteLink}
            </div>
            <Button
              variant={copied === "link" ? "success" : "default"}
              onClick={() => copy(inviteLink, "link")}
            >
              {copied === "link" ? <Check aria-hidden /> : <Copy aria-hidden />}
              {copied === "link" ? "Copied" : "Copy"}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
            Anyone with this link can join the {noun}.
            {onRegenerateCode && " Making a new code turns off old links."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
