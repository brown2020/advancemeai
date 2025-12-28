import {
  createFlashcardFolder as createRepo,
  deleteFlashcardFolder as deleteRepo,
  listFlashcardFolders as listRepo,
  renameFlashcardFolder as renameRepo,
  setFolderSetIds as setSetIdsRepo,
} from "@/api/firebase/flashcardFolderRepository";
import type { FlashcardFolder, FlashcardFolderId } from "@/types/flashcard-folder";
import type { UserId } from "@/types/common";

export async function listFlashcardFolders(userId: UserId): Promise<FlashcardFolder[]> {
  return listRepo(userId);
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


