import {
  createFlashcardFolder as createRepo,
  deleteFlashcardFolder as deleteRepo,
  listFlashcardFolders as listRepo,
  renameFlashcardFolder as renameRepo,
  setFolderSetIds as setSetIdsRepo,
} from "@/api/firebase/flashcardFolderRepository";
import { getFlashcardSetsByIds } from "@/api/firebase/flashcardRepository";
import type {
  FlashcardFolder,
  FlashcardFolderId,
  FlashcardFolderWithVisibility,
  FolderVisibility,
} from "@/types/flashcard-folder";
import {
  calculateFolderVisibility,
  countVisibleSets,
} from "@/types/flashcard-folder";
import type { UserId } from "@/types/common";

export async function listFlashcardFolders(
  userId: UserId
): Promise<FlashcardFolder[]> {
  return listRepo(userId);
}

/**
 * List folders with computed visibility based on contained sets
 * Per SPEC.md 7.1: Folders are visible unless ALL contained sets are private
 */
export async function listFlashcardFoldersWithVisibility(
  userId: UserId
): Promise<FlashcardFolderWithVisibility[]> {
  const folders = await listRepo(userId);

  // Collect all set IDs from all folders
  const allSetIds = new Set<string>();
  folders.forEach((folder) => {
    folder.setIds.forEach((id) => allSetIds.add(id));
  });

  // Fetch all sets at once (more efficient than per-folder)
  const setsMap = new Map<string, { visibility?: string; isPublic: boolean }>();
  if (allSetIds.size > 0) {
    const sets = await getFlashcardSetsByIds(Array.from(allSetIds));
    sets.forEach((set) => {
      setsMap.set(set.id, {
        visibility: set.visibility,
        isPublic: set.isPublic,
      });
    });
  }

  // Calculate visibility for each folder
  return folders.map((folder) => {
    const folderSets = folder.setIds
      .map((id) => setsMap.get(id))
      .filter(
        (s): s is { visibility?: string; isPublic: boolean } => s !== undefined
      );

    return {
      ...folder,
      visibility: calculateFolderVisibility(folderSets),
      visibleSetCount: countVisibleSets(folderSets),
    };
  });
}

/**
 * Calculate visibility for a single folder
 */
export async function getFolderVisibility(
  setIds: string[]
): Promise<{ visibility: FolderVisibility; visibleSetCount: number }> {
  if (setIds.length === 0) {
    return { visibility: "private", visibleSetCount: 0 };
  }

  const sets = await getFlashcardSetsByIds(setIds);
  return {
    visibility: calculateFolderVisibility(sets),
    visibleSetCount: countVisibleSets(sets),
  };
}

export async function createFlashcardFolder(args: {
  userId: UserId;
  name: string;
}): Promise<FlashcardFolderId> {
  return createRepo(args);
}

export async function renameFlashcardFolder(args: {
  userId: UserId;
  folderId: FlashcardFolderId;
  name: string;
}) {
  return renameRepo(args);
}

export async function deleteFlashcardFolder(args: {
  userId: UserId;
  folderId: FlashcardFolderId;
}) {
  return deleteRepo(args);
}

export async function setFlashcardFolderSetIds(args: {
  userId: UserId;
  folderId: FlashcardFolderId;
  setIds: string[];
}) {
  return setSetIdsRepo(args);
}
