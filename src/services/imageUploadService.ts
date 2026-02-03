/**
 * Image Upload Service
 * Handles uploading images to Firebase Storage for flashcards
 */

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "@/config/firebase";
import { logger } from "@/utils/logger";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

/**
 * Validate an image file before upload
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error:
        "Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: "File is too large. Maximum size is 5MB.",
    };
  }

  return { valid: true };
}

/**
 * Generate a unique file path for a flashcard image
 */
function generateImagePath(
  userId: string,
  setId: string,
  cardId: string,
  side: "term" | "definition"
): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  return `flashcards/${userId}/${setId}/${cardId}_${side}_${timestamp}_${randomId}`;
}

/**
 * Upload an image to Firebase Storage
 */
export async function uploadFlashcardImage(
  file: File,
  userId: string,
  setId: string,
  cardId: string,
  side: "term" | "definition"
): Promise<string> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  try {
    const path = generateImagePath(userId, setId, cardId, side);
    const storageRef = ref(storage, path);

    // Upload the file
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        userId,
        setId,
        cardId,
        side,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Get the download URL
    const downloadUrl = await getDownloadURL(snapshot.ref);
    logger.info(`Image uploaded successfully: ${path}`);

    return downloadUrl;
  } catch (error) {
    logger.error("Failed to upload image:", error);
    throw new Error("Failed to upload image. Please try again.");
  }
}

/**
 * Delete an image from Firebase Storage
 */
export async function deleteFlashcardImage(imageUrl: string): Promise<void> {
  if (!imageUrl) return;

  try {
    // Extract the path from the URL
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+?)\?/);
    if (!pathMatch) {
      logger.warn("Could not extract path from image URL:", imageUrl);
      return;
    }

    const path = decodeURIComponent(pathMatch[1]!);
    const storageRef = ref(storage, path);

    await deleteObject(storageRef);
    logger.info(`Image deleted successfully: ${path}`);
  } catch (error) {
    // Log but don't throw - image might already be deleted
    logger.warn("Failed to delete image:", error);
  }
}

/**
 * Upload an image from a data URL (base64)
 */
export async function uploadImageFromDataUrl(
  dataUrl: string,
  userId: string,
  setId: string,
  cardId: string,
  side: "term" | "definition"
): Promise<string> {
  // Convert data URL to blob
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  // Create a File from the blob
  const extension = blob.type.split("/")[1] || "png";
  const file = new File([blob], `image.${extension}`, { type: blob.type });

  return uploadFlashcardImage(file, userId, setId, cardId, side);
}
