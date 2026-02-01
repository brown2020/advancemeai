"use client";

import { useState } from "react";
import { Copy, Check, RefreshCw, Link2, X } from "lucide-react";
import { cn } from "@/utils/cn";

interface InviteLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteCode: string;
  groupName: string;
  onRegenerateCode?: () => Promise<string>;
}

/**
 * Modal for sharing group invite link
 */
export function InviteLinkModal({
  isOpen,
  onClose,
  inviteCode,
  groupName,
  onRegenerateCode,
}: InviteLinkModalProps) {
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [currentCode, setCurrentCode] = useState(inviteCode);

  if (!isOpen) return null;

  const inviteLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/groups/join?code=${currentCode}`
      : `/groups/join?code=${currentCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleRegenerate = async () => {
    if (!onRegenerateCode) return;

    setIsRegenerating(true);
    try {
      const newCode = await onRegenerateCode();
      setCurrentCode(newCode);
    } catch (error) {
      console.error("Failed to regenerate code:", error);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-card border rounded-lg shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Link2 size={18} className="text-primary" />
            <h2 className="font-semibold">Invite to {groupName}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-muted transition-colors"
          >
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Share this link with others to invite them to your study group.
          </p>

          {/* Invite link input */}
          <div className="flex items-center gap-2">
            <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm truncate">
              {inviteLink}
            </div>
            <button
              onClick={handleCopy}
              className={cn(
                "p-3 rounded-lg border transition-colors",
                copied
                  ? "bg-green-500/10 border-green-500 text-green-500"
                  : "hover:bg-muted"
              )}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>

          {/* Invite code display */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Invite Code</p>
              <p className="font-mono font-semibold tracking-wider">
                {currentCode}
              </p>
            </div>
            {onRegenerateCode && (
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className={cn(
                  "p-2 rounded hover:bg-muted transition-colors",
                  isRegenerating && "opacity-50 cursor-not-allowed"
                )}
                title="Generate new code"
              >
                <RefreshCw
                  size={16}
                  className={cn(
                    "text-muted-foreground",
                    isRegenerating && "animate-spin"
                  )}
                />
              </button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Anyone with this link can join the group. You can regenerate the code to
            invalidate old links.
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
