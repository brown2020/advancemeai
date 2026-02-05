import type { Timestamp, UserId } from "@/types/common";
import type { FlashcardVisibility } from "@/types/flashcard";

export type FlashcardFolderId = string;

/**
 * Folder visibility - derived from contained sets per SPEC.md 7.1
 * - visible: At least one set is public or unlisted
 * - private: All contained sets are private (or folder is empty)
 */
export type FolderVisibility = "visible" | "private";

export type FlashcardFolder = {
  id: FlashcardFolderId;
  userId: UserId;
  name: string;
  /** Optional description for the folder */
  description?: string;
  setIds: string[];
  /** Tags/labels for categorization */
  tags?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

/**
 * Folder with computed visibility (for display)
 */
export type FlashcardFolderWithVisibility = FlashcardFolder & {
  /** Computed visibility based on contained sets */
  visibility: FolderVisibility;
  /** Number of visible (non-private) sets */
  visibleSetCount: number;
};

export type FlashcardFolderFormData = {
  name: string;
  description?: string;
  tags?: string[];
};

/**
 * Set info needed for visibility calculation
 */
type SetVisibilityInfo = {
  visibility?: FlashcardVisibility;
  isPublic: boolean;
};

/**
 * Calculate folder visibility based on contained sets
 * Per SPEC.md 7.1: Folders are visible unless ALL contained sets are private
 */
export function calculateFolderVisibility(
  sets: SetVisibilityInfo[]
): FolderVisibility {
  // Empty folders are private
  if (sets.length === 0) return "private";

  // Check if any set is visible (not private)
  const hasVisibleSet = sets.some((set) => {
    const visibility = set.visibility ?? (set.isPublic ? "public" : "private");
    return visibility !== "private";
  });

  return hasVisibleSet ? "visible" : "private";
}

/**
 * Count visible (non-private) sets in a folder
 */
export function countVisibleSets(sets: SetVisibilityInfo[]): number {
  return sets.filter((set) => {
    const visibility = set.visibility ?? (set.isPublic ? "public" : "private");
    return visibility !== "private";
  }).length;
}