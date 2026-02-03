"use client";

import { useState, useRef, useCallback } from "react";
import { Image, Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/utils/cn";
import {
  validateImageFile,
  uploadFlashcardImage,
  deleteFlashcardImage,
} from "@/services/imageUploadService";

interface ImageUploadProps {
  /** Current image URL (if any) */
  imageUrl?: string;
  /** Callback when image is uploaded or removed */
  onChange: (url: string | undefined) => void;
  /** User ID for storage path */
  userId: string;
  /** Set ID for storage path */
  setId: string;
  /** Card ID for storage path */
  cardId: string;
  /** Which side of the card (term or definition) */
  side: "term" | "definition";
  /** Whether the upload is disabled */
  disabled?: boolean;
  /** Custom class name */
  className?: string;
}

export function ImageUpload({
  imageUrl,
  onChange,
  userId,
  setId,
  cardId,
  side,
  disabled = false,
  className,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (file: File) => {
      setError(null);

      // Validate file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error || "Invalid file");
        return;
      }

      setIsUploading(true);
      try {
        // Delete old image if exists
        if (imageUrl) {
          await deleteFlashcardImage(imageUrl);
        }

        // Upload new image
        const url = await uploadFlashcardImage(
          file,
          userId,
          setId,
          cardId,
          side
        );
        onChange(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [imageUrl, onChange, userId, setId, cardId, side]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
      // Reset input so the same file can be selected again
      e.target.value = "";
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleRemove = useCallback(async () => {
    if (!imageUrl) return;

    setIsUploading(true);
    try {
      await deleteFlashcardImage(imageUrl);
      onChange(undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove image");
    } finally {
      setIsUploading(false);
    }
  }, [imageUrl, onChange]);

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, isUploading]);

  if (imageUrl) {
    // Show uploaded image with remove button
    return (
      <div className={cn("relative group", className)}>
        <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
          <img
            src={imageUrl}
            alt={`${side} image`}
            className="w-full h-full object-contain"
          />
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={isUploading}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
              title="Remove image"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Show upload area
  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />
      <button
        type="button"
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        disabled={disabled || isUploading}
        className={cn(
          "w-full aspect-video rounded-lg border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-2",
          isDragOver
            ? "border-primary bg-primary/10"
            : "border-border hover:border-primary/50 hover:bg-muted/50",
          (disabled || isUploading) && "opacity-50 cursor-not-allowed"
        )}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
            <span className="text-sm text-muted-foreground">Uploading...</span>
          </>
        ) : (
          <>
            <div className="p-3 rounded-full bg-muted">
              <Image className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Add Image</p>
              <p className="text-xs text-muted-foreground">
                Drag & drop or click to upload
              </p>
            </div>
          </>
        )}
      </button>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}

/**
 * Compact version for inline use in card editors
 */
export function ImageUploadButton({
  imageUrl,
  onChange,
  userId,
  setId,
  cardId,
  side,
  disabled = false,
}: Omit<ImageUploadProps, "className">) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (file: File) => {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        return;
      }

      setIsUploading(true);
      try {
        if (imageUrl) {
          await deleteFlashcardImage(imageUrl);
        }
        const url = await uploadFlashcardImage(
          file,
          userId,
          setId,
          cardId,
          side
        );
        onChange(url);
      } catch {
        // Error handling can be added
      } finally {
        setIsUploading(false);
      }
    },
    [imageUrl, onChange, userId, setId, cardId, side]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
      e.target.value = "";
    },
    [handleFileSelect]
  );

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
        className={cn(
          "p-2 rounded-lg border hover:bg-muted transition-colors",
          imageUrl && "text-primary border-primary bg-primary/10"
        )}
        title={imageUrl ? "Change image" : "Add image"}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Image className="h-4 w-4" />
        )}
      </button>
    </>
  );
}
