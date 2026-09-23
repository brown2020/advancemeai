"use client";

import { useState } from "react";
import { Check, Code2, Copy, ExternalLink, Link as LinkIcon, Share2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Segmented } from "@/components/ui/segmented";
import { logger } from "@/utils/logger";

interface ShareModalProps {
  title: string;
  url: string;
  embedEnabled?: boolean;
  trigger?: React.ReactNode;
}

type ShareTab = "link" | "embed";

export function ShareModal({
  title,
  url,
  embedEnabled = true,
  trigger,
}: ShareModalProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<ShareTab | null>(null);
  const [activeTab, setActiveTab] = useState<ShareTab>("link");

  const fullUrl = typeof window !== "undefined" ? `${window.location.origin}${url}` : url;

  const embedCode = `<iframe src="${fullUrl}?embed=true" width="100%" height="500" frameborder="0" allowfullscreen></iframe>`;

  const handleCopy = async (text: string, type: ShareTab) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      logger.error("Failed to copy share text", err);
    }
  };

  const openShareWindow = (shareUrl: string) => {
    window.open(shareUrl, "_blank", "width=550,height=420");
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(`Check out "${title}" on Advance.me`);
    openShareWindow(
      `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(fullUrl)}`
    );
  };

  const shareToFacebook = () => {
    openShareWindow(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Share2 aria-hidden />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-accent text-primary max-sm:mx-auto">
            <Share2 className="size-5" aria-hidden />
          </div>
          <DialogTitle className="pr-6 text-lg font-semibold">
            Share &ldquo;{title}&rdquo;
          </DialogTitle>
          <DialogDescription>Anyone with the link can open this set.</DialogDescription>
        </DialogHeader>

        {embedEnabled ? (
          <Segmented<ShareTab>
            label="Share options"
            value={activeTab}
            onChange={setActiveTab}
            options={[
              {
                value: "link",
                label: (
                  <>
                    <LinkIcon className="size-4" aria-hidden />
                    Link
                  </>
                ),
              },
              {
                value: "embed",
                label: (
                  <>
                    <Code2 className="size-4" aria-hidden />
                    Embed
                  </>
                ),
              },
            ]}
          />
        ) : null}

        {activeTab === "link" || !embedEnabled ? (
          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={fullUrl}
                aria-label="Share link"
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 font-mono text-sm"
              />
              <Button
                type="button"
                onClick={() => void handleCopy(fullUrl, "link")}
                className="shrink-0"
              >
                {copied === "link" ? <Check aria-hidden /> : <Copy aria-hidden />}
                {copied === "link" ? "Copied" : "Copy"}
              </Button>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                Or share on social
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" onClick={shareToTwitter}>
                  <ExternalLink aria-hidden />X / Twitter
                </Button>
                <Button type="button" variant="outline" onClick={shareToFacebook}>
                  <ExternalLink aria-hidden />
                  Facebook
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <label htmlFor="share-embed-code" className="block text-sm font-semibold">
              Embed code
            </label>
            <Textarea
              id="share-embed-code"
              readOnly
              value={embedCode}
              rows={4}
              onFocus={(e) => e.currentTarget.select()}
              className="resize-none bg-secondary/50 font-mono text-xs"
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Paste into your website or blog to embed this set.
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void handleCopy(embedCode, "embed")}
              >
                {copied === "embed" ? <Check aria-hidden /> : <Copy aria-hidden />}
                {copied === "embed" ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        )}

        <p className="sr-only" aria-live="polite">
          {copied ? "Copied to clipboard" : ""}
        </p>
      </DialogContent>
    </Dialog>
  );
}
