"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Share2,
  Link as LinkIcon,
  Copy,
  Check,
  Code,
  Twitter,
  Facebook,
} from "lucide-react";
import { cn } from "@/utils/cn";

interface ShareModalProps {
  title: string;
  url: string;
  embedEnabled?: boolean;
  trigger?: React.ReactNode;
}

export function ShareModal({
  title,
  url,
  embedEnabled = true,
  trigger,
}: ShareModalProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<"link" | "embed" | null>(null);
  const [activeTab, setActiveTab] = useState<"link" | "embed">("link");

  const fullUrl = typeof window !== "undefined"
    ? `${window.location.origin}${url}`
    : url;

  const embedCode = `<iframe src="${fullUrl}?embed=true" width="100%" height="500" frameborder="0" allowfullscreen></iframe>`;

  const handleCopy = async (text: string, type: "link" | "embed") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(`Check out "${title}" on Advance.me`);
    const shareUrl = encodeURIComponent(fullUrl);
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}`,
      "_blank",
      "width=550,height=420"
    );
  };

  const shareToFacebook = () => {
    const shareUrl = encodeURIComponent(fullUrl);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
      "_blank",
      "width=550,height=420"
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share &ldquo;{title}&rdquo;
          </DialogTitle>
          <DialogDescription>
            Share this flashcard set with others
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tabs */}
          {embedEnabled && (
            <div className="flex border-b border-border">
              <button
                onClick={() => setActiveTab("link")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                  activeTab === "link"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <LinkIcon className="h-4 w-4" />
                Link
              </button>
              <button
                onClick={() => setActiveTab("embed")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                  activeTab === "embed"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Code className="h-4 w-4" />
                Embed
              </button>
            </div>
          )}

          {/* Link Tab */}
          {activeTab === "link" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={fullUrl}
                  className="flex-1 font-mono text-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleCopy(fullUrl, "link")}
                  className="shrink-0"
                >
                  {copied === "link" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Social Share */}
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  Or share on social media
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={shareToTwitter}
                    className="flex-1"
                  >
                    <Twitter className="h-4 w-4 mr-2" />
                    Twitter
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={shareToFacebook}
                    className="flex-1"
                  >
                    <Facebook className="h-4 w-4 mr-2" />
                    Facebook
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Embed Tab */}
          {activeTab === "embed" && embedEnabled && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Embed Code
                </label>
                <div className="relative">
                  <textarea
                    readOnly
                    value={embedCode}
                    rows={3}
                    className="w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm font-mono resize-none"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => handleCopy(embedCode, "embed")}
                    className="absolute top-2 right-2"
                  >
                    {copied === "embed" ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Paste this code into your website or blog to embed this
                flashcard set.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
