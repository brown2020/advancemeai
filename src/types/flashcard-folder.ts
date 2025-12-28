import type { Timestamp, UserId } from "@/types/common";

export type FlashcardFolderId = string;

export type FlashcardFolder = {
  id: FlashcardFolderId;
  userId: UserId;
  name: string;
  setIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type FlashcardFolderFormData = {
  name: string;
};


