import type { Timestamp, UserId } from "@/types/common";

export type FlashcardFolderId = string;

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
