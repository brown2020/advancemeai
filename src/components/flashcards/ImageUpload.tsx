"use client";

import { useCallback, useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";
import {
  validateImageFile,
  uploadFlashcardImage,
  deleteFlashcardImage,
} from "@/services/imageUploadService";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/gif,image/webp";

interface ImageUploadButtonProps {
  /** Current image URL (if any) */
  imageUrl?: string;
  /** Called with the new URL after a successful upload */
  onChange: (url: string | undefined) => void;
  /** Called with a user-facing message when validation or upload fails */
  onError?: (message: string) => void;
  /** User ID for storage path */
  userId: string;
  /** Set ID for storage path */
  setId: string;
  /** Card ID for storage path */
  cardId: string;
  /** Which side of the card (term or definition) */
  side: "term" | "definition";
  disabled?: boolean;
  className?: string;
}

/**
 * Compact icon button that uploads (or replaces) an image for one side of a
 * card. Replacing deletes the previous image from storage first.
 */
export function ImageUploadButton({
  imageUrl,
  onChange,
  onError,
  userId,
  setId,
  cardId,
  side,
  disabled = false,
  className,
}: ImageUploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (file: File) => {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        onError?.(validation.error ?? "Invalid file");
        return;
      }

      setIsUploading(true);
      try {
        if (imageUrl) {
          await deleteFlashcardImage(imageUrl);
        }
        const url = await uploadFlashcardImage(file, userId, setId, cardId, side);
        onChange(url);
      } catch (err) {
        onError?.(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [imageUrl, onChange, onError, userId, setId, cardId, side]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void handleFileSelect(file);
      // Reset so the same file can be picked again
      e.target.value = "";
    },
    [handleFileSelect]
  );

  const label = imageUrl ? `Change ${side} image` : `Add ${side} image`;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isUploading}
        tabIndex={-1}
        aria-hidden
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
        aria-label={label}
        title={label}
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-xl border transition-colors",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15",
          "disabled:cursor-not-allowed disabled:opacity-60",
          imageUrl
            ? "border-primary/40 bg-accent text-primary"
            : "border-input bg-card text-muted-foreground hover:border-primary/40 hover:text-primary",
          className
        )}
      >
        {isUploading ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <ImagePlus className="size-4" aria-hidden />
        )}
      </button>
    </>
  );
}
